var momentTz = require("moment-timezone");
const mongoose = require("mongoose");
const sendEmail = require('../config/email')
const Users = require("../models/Users");
const Posts = require("../models/Posts");
const aws = require("aws-sdk");
const {
  s3Config_bucketPost,
  s3Config_accessKeyId,
  s3Config_secretAccessKey
} = require("../.env");


module.exports = (app) => {
  const getOne = async (req, res) => {
    const { post } = req.params;

    const user = req.user;

    const postToBeRemoved = await Posts.findById(post).catch((err) => {
      return res.status(400).json(err);
    }); //Caso o id seja inválido vai cair aqui
    if (!postToBeRemoved) {
      return res.status(400).send("Post não encontrado");
    } //Caso o id seja válido mas não exista vai cair aqui

    const posts = await Posts.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(post) } },
      { $sort: { postedIn: -1 } },
      {
        $addFields: {
          didILiked: {
            $in: [mongoose.Types.ObjectId(user.id), "$likes"],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { user: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$user"] },
              },
            },
            { $project: { name: 1, url: 1, _id: 1 } },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      // { $lookup: { from: 'users', localField: 'likes', foreignField: '_id', as: 'likes' } },
    ]).catch((err) => res.status(400).json(err));

    return res.json(posts);
  };
  const getByUser = async (req, res) => {
    const { id } = req.params;
    const { type } = req.headers;
    const userAtual = req.user;

    if (id == undefined) {
      return res.status(401).send("Usuário inválido");
    }
    const typeSearch = type == "false" ? false : true;
    //Páginação
    const qtdLoad = 5;
    const { page = 1 } = req.query;

    const user = await Users.findById(id).catch((err) =>
      res.status(400).json(err)
    );
    if (!user) {
      return res.status(401).send("Usuário inválido");
    }

    const count = await Posts.find({
      user: user._id,
      type: typeSearch,
    }).countDocuments();
    res.header("X-Total-Count", count);

    const posts = await Posts.aggregate([
      { $match: { user: user._id, type: typeSearch } },

      { $sort: { postedIn: -1 } },
      {
        $lookup: {
          from: "posts_comments",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$$postId", "$post"] } } },
            { $count: "count" },
          ],
          as: "commentsCount",
        },
      },
      {
        $addFields: {
          didILiked: {
            $in: [mongoose.Types.ObjectId(userAtual.id), "$likes"],
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$commentsCount.count", 0] }, 0],
          },
        },
      },
      { $skip: (page - 1) * qtdLoad },
      { $limit: qtdLoad },
      {
        $lookup: {
          from: "users",
          let: { user: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$user"] },
              },
            },
            { $project: { name: 1, url: 1, _id: 1 } },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      // { $lookup: { from: 'users', localField: 'likes', foreignField: '_id', as: 'likes' } },
    ]).catch((err) => res.status(400).json(err));

    return res.json(posts);
  };

  const getLikesByUser = async (req, res) => {
    const { id } = req.params;
    const { type } = req.headers;
    const { page = 1 } = req.query;

    if (id == undefined) {
      return res.status(401).send("Usuário inválido");
    }
    const typeSearch = type == "false" ? false : true;
    //Páginação
    const qtdLoad = 5;

    const user = await Users.findById(id).catch((err) =>
      res.status(400).json(err)
    );
    if (!user) {
      return res.status(401).send("Usuário inválido");
    }

    const count = await Posts.find({
      likes: { $in: [user._id] },
      type: typeSearch,
    })
      .countDocuments()
      .catch((err) => res.status(400).json(err));
    res.header("X-Total-Count", count);
    const posts = await Posts.aggregate([
      { $match: { likes: { $in: [user._id] }, type: typeSearch } },
      { $sort: { postedIn: -1 } },
      {
        $lookup: {
          from: "posts_comments",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$$postId", "$post"] } } },
            { $count: "count" },
          ],
          as: "commentsCount",
        },
      },
      {
        $addFields: {
          didILiked: {
            $in: [mongoose.Types.ObjectId(user._id), "$likes"],
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$commentsCount.count", 0] }, 0],
          },
        },
      },
      { $skip: (page - 1) * qtdLoad },
      { $limit: qtdLoad },
      {
        $lookup: {
          from: "users",
          let: { user: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$user"] },
              },
            },
            { $project: { name: 1, url: 1, _id: 1 } },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      // { $lookup: { from: 'users', localField: 'likes', foreignField: '_id', as: 'likes' } },
    ]).catch((err) => res.status(400).json(err));
    return res.json(posts);
  };

  const getTotalPosts = async (req, res) => {
    const { type, search_text } = req.headers;
    const typeSearch = type == "false" ? false : true;
    const user = req.user;

    if (!type) {
      return res.status(400).send("Campos inválidos");
    }
    const count = await Posts.find({
      tags: { $in: search_text != "" ? search_text.split(",") : user.tags },
      type: typeSearch,
      user: { $nin: user.blocked },
    })
      .countDocuments()
      .catch((err) => res.status(400).send(err));
    res.header("X-Total-Count", count);
    return res.json(count);
  };

  const index = async (req, res) => {
    const { type, search_type } = req.headers;
    let { search_text } = req.headers;
    search_text = search_text.trim();
    const typeSearch = type == "false" ? false : true;
    //Páginação
    const qtdLoad = 5;
    const { page = 1 } = req.query;

    const user = req.user;

    //Montagem dos filtros
    const followed = user.followed
    followed.push(user.id)
    let match = {
      type: typeSearch,
      user: { $nin: user.blocked }
    };

    if (search_type === "" || search_text === "") {
      match.tags = { $in: user.tags };
    } else {
      if (search_type === "tags") {
        match.tags = { $in: search_text.split(",") };
      } else {
        if (search_type === "title") {
          match.title = { $regex: search_text, $options: "i" };
        } else {
          if (search_type === "desc") {
            match.desc = { $regex: search_text, $options: "i" };
          }
        }
      }
    }
    const posts = await Posts.aggregate([
      {
        $match: { $or: [match, { $and: [{ user: { $in: followed }, type: typeSearch }] }] },
      },
      { $sort: { postedIn: -1 } },
      {
        $lookup: {
          from: "posts_comments",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$$postId", "$post"] } } },
            { $count: "count" },
          ],
          as: "commentsCount",
        },
      },
      {
        $addFields: {
          didILiked: {
            $in: [mongoose.Types.ObjectId(user.id), "$likes"],
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$commentsCount.count", 0] }, 0],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { user: "$user" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$user"] },
              },
            },
            { $project: { name: 1, url: 1, _id: 1 } },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $facet: {
          paginatedResults: [
            { $skip: (page - 1) * qtdLoad },
            { $limit: qtdLoad },
          ],
          totalCount: [
            {
              $count: "count",
            },
          ],
        },
      },
    ]).catch((err) => res.status(400).json(err));

    return res.json(posts);
  };

  const save = async (req, res) => {
    //const { filename } = req.file;
    let { title, desc, tags } = req.body;
    const { type } = req.headers;
    title.trim();
    desc.trim();
    const user = req.user;

    const valid = !title || !desc || !tags || type != true || type != false;
    valid == false
      ? res.status(400).send("Algum campo não foi preenchido")
      : null;
    if (title.trim() === "" || desc.trim() === "") {
      return res.status(400).send("Algum campo não foi preenchido");
    }
    const post = await Posts.create({
      title,
      desc,
      postedIn: momentTz().tz("America/Sao_Paulo").format(),
      tags: tags.split(",").map((tag) => tag.trim().toLowerCase()),
      type,
      closed: false,
      user: user.id,
      files: [],
    }).catch((err) => res.status(400).json(err));
    if (user.ranking === NaN || user.ranking === undefined) {
      value = 5;
    } else {
      value = user.ranking + 5;
    }
    const result = await Users.findByIdAndUpdate(user.id, { ranking: value });
    return res.status(201).json(post);
  };

  const remove = async (req, res) => {
    const { post } = req.params;
    const user = req.user;

    const postToBeRemoved = await Posts.findById(post).catch((err) => {
      return res.status(400).json(err);
    }); //Caso o id seja inválido vai cair aqui
    if (!postToBeRemoved) {
      return res.status(400).send("Post não encontrado com o id: " + post);
    } //Caso o id seja válido mas não exista vai cair aqui

    if (postToBeRemoved.user == user.id) {
      //Se é o dono post deleta
      await Posts.deleteOne(postToBeRemoved);
      if (user.ranking === NaN || user.ranking === undefined) {
        value = 0;
      } else {
        value = user.ranking - 5;
      }
      const result = await Users.findByIdAndUpdate(user.id, {
        ranking: value,
      }).catch((err) => {
        return res.status(400).json(err);
      });
      return res.status(204).send();
    } else {
      //Se não, não tem permissão
      return res
        .status(401)
        .send(`Usuário ${user.name} não autorizado a deletar o post.`);
    }
  };

  const like = async (req, res) => {
    const { post } = req.params;
    const user = req.user;

    const postToUpdate = await Posts.findById(post).catch((err) =>
      res.status(400).json(err)
    ); //Caso o id seja inválido vai cair aqui
    if (!postToUpdate) {
      //Caso o id seja válido mas não exista vai cair aqui
      res.status(400).send("Post não encontrado com o id: " + req.params);
    } else {
      if (postToUpdate.likes.find((u) => u == user.id)) {
        //Descurtindo
        const index = postToUpdate.likes.indexOf(user.id);
        if (index > -1) {
          postToUpdate.likes.splice(index, 1);
        }
        await postToUpdate.save().catch((err) => res.status(400).json(err));
        res.status(201).send();
      } else {
        //Curtindo
        postToUpdate.likes.push(user.id);
        await postToUpdate.save().catch((err) => res.status(400).json(err));

        res.status(204).send();
      }
    }
  };

  const upload = async (req, res) => {
    const { post } = req.params;
    const { file_num = 0 } = req.headers;
    let { key = "", location: url = "" } = "";
    const user = req.user;

    if (req.file) {
      try {
        Posts.findById(post).then((p) => {
          if (p.user._id != user.id) {
            return res
              .status(401)
              .send(`Usuário ${user.name} não autorizado a anexar ao post.`);
          }
          if (p.files[file_num] != undefined) {
            const keyUrl = p.files[file_num].url.split("/");
            var s3 = new aws.S3({
              accessKeyId: s3Config_accessKeyId,
              secretAccessKey: s3Config_secretAccessKey,
            });
            var params = {
              Bucket: s3Config_bucketPost,
              Key: `${keyUrl[3]}`,
            };
            s3.deleteObject(params, function (err, data) {
              if (err) console.log(err, err.stack);
              // error
              else console.log(); // deleted
            });
          }
          arq = {
            name: req.file.originalname,
            format: req.file.mimetype.split("/")[1],
            url: req.file.location,
            date: momentTz().tz("America/Sao_Paulo").format()
          };
          url = req.file.location;
          if (url == null) {
            url = `http:${hostIp}:3333/files/${key}`;
          }
          p.files.splice(file_num, 1, arq);
          p.save().catch((err) => res.status(400).json(err));
        });
      } catch (e) {
        console.log(e); // deleted
      }
      return res.status(201).send();
    } else {
      return res.status(204).send("Nenhum arquivo enviado");
    }
  };

  const report = async (req, res) => {
    const { post } = req.params;

    const postToBeReport = await Posts.findById(post).catch((err) => {
      return res.status(400).json(err);
    }); //Caso o id seja inválido vai cair aqui
    const userToBeReport = await Users.findById(postToBeReport.user).catch(
      (err) => {
        return res.status(400).json(err);
      }
    ); //Caso o id seja inválido vai cair aqui
    title = "Postagem reportada!"
    body = `<p>Olá ${userToBeReport.name}, parece que o seu post <b>"${postToBeReport.title}"</b> foi reportado por outro usuário que identificou informações que vão contra as regras de uso do aplicativo.</p>
     <h4>Equipe Esclareça solicita que retorne ao aplicativo e verifique as informações dessa postagem.</h4>
     <p>As boas práticas de uso e de conteúdo devem sempre permanecer para garantir o bom proveito do app! :)</p></br>
     <h4>Equipe Esclareça agradece a compreensão!</h4>
     <a href="https://docs.google.com/uc?export=download&id=1N5NnNwp_jhIVKIo8m4Ih8bfDOJ_uKWId">Leia aqui nossos termos de uso!</a></br>     
     <a href="https://docs.google.com/uc?export=download&id=16z5VqvJivEabAFiOSTVzB2tdiW_FqZkN">Leia aqui nossos termos de privacidade!</a>
                `
    await sendEmail(userToBeReport.email, title, body)
    res.status(200).json({
      message: "Post reportado",
    });
  };

  return {
    index,
    save,
    remove,
    getOne,
    getTotalPosts,
    like,
    getByUser,
    getLikesByUser,
    upload,
    report,
  };
};
