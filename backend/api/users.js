const bcrypt = require("bcrypt-nodejs");
const Users = require("../models/Users");
const { hostIp } = require("../.env");
const sendEmail = require('../config/email')
const crypto = require("crypto");
const aws = require("aws-sdk");
var momentTz = require("moment-timezone");

const {
  s3Config_bucket,
  s3Config_accessKeyId,
  s3Config_secretAccessKey
} = require("../.env");

module.exports = (app) => {
  const obterHash = (password, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, null, (err, hash) => callback(hash));
    });
  };
  const save = async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const tags = req.body.tags.trim();
    const type = req.body.type;

    let { key = "", location: url = "" } = "";

    if (req.body.avatarUser) {
      url = req.body.avatarUser;
    } else {
      if (req.file) {
        key = req.file.key;
        url = req.file.location;
      }
    }

    const userExist = await Users.findOne({ email });
    if (userExist) {
      res.status(400).json(`${email} já foi cadastrado\nEsqueceu sua senha?`);
    } else {
      if (type == 'app') {
        obterHash(req.body.password.trim().toLowerCase(), (hash) => {
          Users.create({
            name: req.body.name,
            email,
            password: hash,
            tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
            key,
            url,
            ranking: 0,
            blocked: [],
            followed: [],
            idGoogle: '',
            idFacebook: '',
          })
            .then((u) => res.status(204).send(u))
            .catch((err) => res.status(400).json(err));
        });
      } else {
        Users.create({
          name: req.body.name,
          email,
          password: '',
          tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
          key,
          url,
          ranking: 0,
          blocked: [],
          followed: [],
          idGoogle: type == 'google' ? req.body.idGoogle : '',
          idFacebook: type == 'facebook' ? req.body.idFacebook : '',
        })
          .then((u) => res.status(204).send(u))
          .catch((err) => res.status(400).json(err));
      }
    }
  };
  const update = (req, res) => {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const tags = req.body.tags.trim();

    const user = req.user;

    let { key = "", location: url = "" } = "";
    if (req.file) {
      key = req.file.key;
      url = req.file.location;
      if (url == null) {
        url = `http:${hostIp}:3333/files/${key}`;
      }
      Users.findByIdAndUpdate(user.id, { key, url })
        .then((_) => res.status(204).send())
        .catch((err) => res.status(400).json(err));
    } else {
      if (req.body.password.trim()) {
        obterHash(req.body.password.trim().toLowerCase(), (hash) => {
          Users.findByIdAndUpdate(user.id, {
            name,
            email,
            password: hash,
            tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
          })
            .then((_) => res.status(204).send())
            .catch((err) => res.status(500).json(err));
        });
      } else {
        console.log(req.body.password)
        console.log(tags)
        Users.findByIdAndUpdate(user.id, {
          name,
          email,
          tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
        })
          .then((_) => res.status(204).send())
          .catch((err) => res.status(500).json(err));
      }
    }
  };

  const upload = async (req, res) => {
    const user = req.user;
    let { key = "", location: url = "" } = "";
    if (req.file) {
      try {
        userTemp = Users.findById(user.id).then((u) => {
          var s3 = new aws.S3({
            accessKeyId: s3Config_accessKeyId,
            secretAccessKey: s3Config_secretAccessKey,
          });
          if (u.key && u.key != undefined) {
            var params = { Bucket: s3Config_bucket, Key: u.key };
            s3.deleteObject(params, function (err, data) {
              if (err) console.log(err, err.stack);
              // error
              else console.log(); // deleted
            });
          }
          key = req.file.key;
          url = req.file.location;
          if (url == null) {
            url = `http:${hostIp}:3333/files/${key}`;
          }
          u.key = key;
          u.url = url;
          u.save().catch((err) => res.status(400).json(err));
        });
      } catch (e) {
        console.log(e); // deleted
      }
      return res.status(201).send();
    } else {
      return res.status(204).send("Nenhum arquivo enviado");
    }
  };

  const patch = (req, res) => {
    const user = req.user;
    const tags = req.body.tags.trim().toLowerCase();

    user = Users.findByIdAndUpdate(user.id, {
      tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
    })
      .then((_) => res.status(204).send())
      .catch((err) => res.status(400).json(err));
  };

  const profile = async (req, res) => {
    const { id } = req.params;
    const userLogged = req.user;

    const user = await Users.findById(id).catch((err) =>
      res.status(400).json(err)
    );
    if (!user) {
      res.status(404).json("Usuário não encontrado!")
    }
    let response = { user, isBlocked: false, isFollowed: false };
    if (userLogged.blocked.find((u) => u == id)) {
      //Usuário está bloqueado pelo usuário logado
      response.isBlocked = true;
    }
    if (userLogged.followed.find((u) => u == id)) {
      //Usuário está sendo seguido pelo usuário logado
      response.isFollowed = true;
    }
    res.json(response);
  };

  const list = async (req, res) => {
    const top = await Users.find()
      .sort({ ranking: -1 })
      .limit(10)
      .catch((err) => res.status(400).json(err));
    res.json(top);
  };

  const index = async (req, res) => {
    const { search_text } = req.headers;
    //Páginação
    const qtdLoad = 10;
    const { page = 1 } = req.query;

    const count = await Users.find({
      name: { $regex: `${search_text}`, $options: "i" },
    }).countDocuments();

    res.header("X-Total-Count", count);

    const users = await Users.find({
      name: { $regex: `${search_text}`, $options: "i" },
    })
      .sort({ ranking: -1 })
      .skip((page - 1) * qtdLoad)
      .limit(qtdLoad)
      .catch((err) => res.status(400).json(err));
    res.json(users);
  };

  const blockUser = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (id == user.id) {
      return res.status(400).send("Não é possível bloquear você mesmo");
    }

    const userToBlock = await Users.findById(id).catch((err) =>
      res.status(400).json(err)
    );
    if (!userToBlock) {
      return res.status(401).send("Usuário a bloquear inválido");
    }
    const userLogged = await Users.findById(user.id).catch((err) =>
      res.status(400).json(err)
    );
    if (!userLogged) {
      return res.status(401).send("Usuário logado é inválido");
    }

    if (userLogged.blocked.find((u) => u == id)) {
      //Desbloqueando
      const index = userLogged.blocked.indexOf(id);
      if (index > -1) {
        userLogged.blocked.splice(index, 1);
      }
      await userLogged.save().catch((err) => res.status(400).json(err));
      res.status(201).send();
    } else {
      //Bloqueando
      if (userLogged.followed.find((u) => u == id)) {
        //Deixando de seguir
        const index = userLogged.followed.indexOf(id);
        if (index > -1) {
          userLogged.followed.splice(index, 1);
        }
        await userLogged.save().catch((err) => res.status(400).json(err));
      }

      userLogged.blocked.push(id);
      await userLogged.save().catch((err) => res.status(400).json(err));

      res.status(204).send();
    }
  };

  const followUser = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (id == user.id) {
      return res.status(400).send("Não é possível seguir você mesmo");
    }

    const userToBlock = await Users.findById(id).catch((err) =>
      res.status(400).json(err)
    );
    if (!userToBlock) {
      return res.status(401).send("Usuário a seguir inválido");
    }
    const userLogged = await Users.findById(user.id).catch((err) =>
      res.status(400).json(err)
    );
    if (!userLogged) {
      return res.status(401).send("Usuário logado é inválido");
    }

    if (userLogged.followed.find((u) => u == id)) {
      //Deixando de seguir
      const index = userLogged.followed.indexOf(id);
      if (index > -1) {
        userLogged.followed.splice(index, 1);
      }
      await userLogged.save().catch((err) => res.status(400).json(err));
      res.status(201).send();
    } else {
      //Seguindo
      userLogged.followed.push(id);
      await userLogged.save().catch((err) => res.status(400).json(err));

      res.status(204).send();
    }
  };

  const forgotPassword = async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    crypto.randomBytes(3, async (err, buffer) => {
      if (err) {
        console.log(err);
      }
      const token = buffer.toString("hex");
      const userExist = await Users.findOne({ email });
      if (!userExist) {
        return res.status(400).json(`${email} inexistente!`);
      } else {
        obterHash(token.trim().toLowerCase(), (hash) => {
          userExist.hashForgot = hash;
          userExist.hashExpiresAt = momentTz().add(1, 'h').tz("America/Sao_Paulo").format()
          userExist.save().then((savedUser) => {
            title = "Esqueceu a senha"
            body = `<p>Olá ${userExist.name}, você esqueceu sua senha?</p>
                    <h4>Este é o seu código: </h4>
                    <h3>${token}<h3>
                    <h4>O token é válido por uma hora!</h4>
                    <p>Volte para o aplicativo e insira-o no campo destinado para prosseguir! :)</p>`
            sendEmail(email, title, body)
            res.status(200).json({
              message: "Verifique seu e-mail e faça o login com a sua senha!",
            });
          });
        });
      }
    });
  };

  const resetPassword = async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const hash = req.body.hash.trim().toLowerCase();
    const newPass = req.body.newPass.trim().toLowerCase();

    const userExist = await Users.findOne({ email });
    if (!userExist) {
      return res.status(400).send(`${email} inexistente!`);
    } else {
      console.log(new Date() + " - " + userExist.hashExpiresAt)
      if (new Date() > userExist.hashExpiresAt) {
        return res.status(401).send("O token está expirado!");
      } else {
        bcrypt.compare(hash, userExist.hashForgot, (err, isMatch) => {
          if (err || !isMatch) {
            res.status(401).send("Código informálido inválido.");
            return;
          }
          obterHash(newPass, (cod) => {
            userExist.password = cod;
            userExist.save().then((savedUser) => {
              res.status(200).json({ message: "Senha alterada com sucesso!" });
            });
          });
        });
      }
    }
  };

  const pushTokenPass = async (req, res) => {
    const token = req.body.token;
    const userExist = req.body.user;
    user = Users.findByIdAndUpdate(userExist, {
      pushToken: token,
    })
      .then((_) => res.status(204).send())
      .catch((err) => res.status(500).json(err));
  };

  return {
    save,
    update,
    patch,
    profile,
    upload,
    list,
    blockUser,
    followUser,
    index,
    forgotPassword,
    resetPassword,
    pushTokenPass,
  };
};
