var momentTz = require('moment-timezone');
const mongoose = require('mongoose');

const Users = require('../models/Users');
const Slacks = require('../models/Slacks');
const Slacks_Messages = require('../models/Slacks_Messages');

module.exports = app => {
    const index = async (req, res) => {
        const { search_text } = req.headers;
        const { page } = req.query;
        const user = req.user;
        const qtdLoad = 10
        const searchText = search_text.trim() != '' ? [mongoose.Types.ObjectId(search_text)] : []
        const count = await Slacks.find({ tag: { $in: search_text.trim() != '' ? searchText : user.tags }, user: { $nin: user.blocked } }).countDocuments()
        res.header('X-Total-Count', count)
        const slacks = await Slacks
            .aggregate([//Condição da esquerda ou user q criou
                { $match: { $or: [{ tag: { $in: search_text.trim() != '' ? searchText : user.tags }, user: { $nin: user.blocked } }] } },
                // { $match: { user: mongoose.Types.ObjectId(user.id)} },//Condição da esquerda ou user q criou
                { $sort: { createdIn: -1 } },
                {
                    $lookup: {
                        from: 'slacks_messages',
                        let: { slackId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$$slackId", "$slack"] } } },
                            { $count: "count" }
                        ],
                        as: 'messages'
                    }
                },
                {
                    "$addFields": {
                        "messages": { "$ifNull": [{ "$arrayElemAt": ["$messages.count", 0] }, 0] }
                    }
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'user': '$user' },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': { '$eq': ['$_id', '$$user'] }
                                }
                            },
                            { '$project': { 'name': 1, '_id': 1 } }
                        ],
                        'as': "user"
                    }
                },
                { $unwind: '$user' },
                {
                    $lookup: {
                        from: "tags",
                        foreignField: "_id",
                        localField: "tag",
                        as: "tag"
                    }
                },
                { $skip: (page - 1) * qtdLoad },
                { $limit: qtdLoad },
            ])
            .catch(err => res.status(400).json(err))
        return res.json(slacks)
    }
    const save = async (req, res) => {
        let { nome, tag, senha } = req.body;
        const user = req.user;
        const tagSelected = [mongoose.Types.ObjectId(tag)]

        if (!nome || nome.trim() == '') {
            return res.status(400).send("Verifique se o nome foi preenchido corretamente e tente novamente")
        }
        if (!tag || tag.trim() == '') {
            return res.status(400).send("Verifique se a tag foi preenchida corretamente e tente novamente")
        }

        nome = nome.trim()
        senha = senha ? senha.trim() : ''

        const slack = await Slacks.create({
            nome,
            tag: tagSelected,
            senha,
            createdIn: momentTz().tz("America/Sao_Paulo").format(),
            user: user.id,
        })
            .catch(err => res.status(400).json(err))
        Slacks.populate((slack), { path: "tag" })
        //Soma os pontos ao ranking do usuário
        const result = await Users.findByIdAndUpdate(user.id, { ranking: user.ranking + 5 })
        return res.status(201).json(slack)
    }
    const remove = async (req, res) => {
        const { slack } = req.params;
        const user = req.user;

        const slackRemove = await Slacks.findById(slack)
            .catch(err => { return res.status(400).json(err) })//Caso o id seja inválido vai cair aqui
        if (!slackRemove) { return res.status(400).send("Slack não encontrado com o id: " + slack) }//Caso o id seja válido mas não exista vai cair aqui
        if (slackRemove.user == user.id) {//Se é o dono post deleta
            const slacks = await Slacks_Messages.find({ slack: slack }).countDocuments()
            if (slacks == 0) {
                await Slacks.deleteOne(slackRemove)
                const result = await Users.findByIdAndUpdate(user.id, { ranking: user.ranking - 5 })
                    .catch(err => { return res.status(400).json(err) })
                return res.status(204).send()
            }
            return res.status(406).json('O EsclaChat não pode ser excluído enquanto existirem mensagens no mesmo')

        } else {//Se não, não tem permissão
            return res.status(401).send(`Usuário ${user.name} não autorizado a deletar o post.`)
        }
    }

    return { index, save, remove }
}