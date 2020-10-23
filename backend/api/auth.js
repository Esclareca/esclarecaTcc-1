const { authSecret } = require('../.env')
const jwt = require('jwt-simple')
const bcrypt = require('bcrypt-nodejs')
const Users = require('../models/Users');

module.exports = app => {
    const signin = async (req, res) => {
        if (!req.body.email) {
            return res.status(400).send('Email não preenchido')
        }
        const email = req.body.email.trim().toLowerCase()
        const password = req.body.password.trim().toLowerCase()
        const idGoogle = req.body.idGoogle
        const idFacebook = req.body.idFacebook
        const type = req.body.type
        const user = await Users.findOne({ email })
        if (user) {
            if (type == 'app') {
                if (!password || password == '') {
                    return res.status(400).send('Senha não preenchida')
                }
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err || !isMatch) {
                        res.status(401).send('A senha informada é inválida!')
                        return//Forçando a saída, caso a senha seja inválida
                    }
                    const payload = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    }

                    res.json({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        tags: user.tags,
                        token: jwt.encode(payload, authSecret),
                        key: user.key,
                        url: user.url,
                        createdAt: user.createdAt
                    })
                })
            } else {             
                if (type == 'google') {
                    if (user.idGoogle == idGoogle) {
                        const payload = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                        }

                        res.json({
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            tags: user.tags,
                            token: jwt.encode(payload, authSecret),
                            key: user.key,
                            url: user.url,
                            createdAt: user.createdAt
                        })
                    }
                }
                if (type == 'facebook') {
                    if (user.idFacebook == idFacebook) {
                        const payload = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                        }

                        res.json({
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            tags: user.tags,
                            token: jwt.encode(payload, authSecret),
                            key: user.key,
                            url: user.url,
                            createdAt: user.createdAt
                        })
                    }
                }

            }
        } else {
            res.status(400).json('Email não encontrado')
        }
    }
    return { signin }
}