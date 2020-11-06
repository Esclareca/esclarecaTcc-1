var momentTz = require('moment-timezone');
const mongoose = require('mongoose');

const Users = require('../models/Users');
const Slacks = require('../models/Slacks');
const Slacks_Messages = require('../models/Slacks_Messages');

module.exports = app => {
    const index = async (req, res) => {
        const { slack } = req.params;
        const { last_id } = req.headers;
        //Páginação
        const qtdLoad = 5
        const { page = 1 } = req.query;
        const user = req.user;

        const slackOri = await Slacks.findById(slack)
            .catch(err => res.status(400).json(err))
        if (!slackOri) {
            return res.status(401).send('Slack inválida');
        }
        const count = await Slacks_Messages.find({ slack }).countDocuments()
        res.header('X-Total-Count', count)
        let messages
        if (last_id == 0) {
            messages = await Slacks_Messages.find({ slack: slackOri._id, user: { $nin: user.blocked } })
                .populate('user', ['name', 'url'])
                .sort({ postedIn: 1 })
                // .skip((page - 1) * qtdLoad)
                .limit(qtdLoad)
        } else {
            messages = await Slacks_Messages.find({ slack: slackOri._id, user: { $nin: user.blocked }, _id: { $gt: last_id } })
                .populate('user', ['name', 'url'])
                .sort({ postedIn: 1 })
                // .skip((page - 1) * qtdLoad)
                .limit(qtdLoad)
        }

        // const messages = await Slacks_Messages
        //     .aggregate([
        //         { $match: { slack: slackOri._id, user: { $nin: user.blocked }, _id: { $gt: ["_id", 0] } } },
        //         { $sort: { postedIn: 1 } },
        //         {
        //             '$lookup': {
        //                 'from': 'users',
        //                 'let': { 'user': '$user' },
        //                 'pipeline': [
        //                     {
        //                         '$match': {
        //                             '$expr': { '$eq': ['$_id', '$$user'] }
        //                         }
        //                     },
        //                     { '$project': { 'name': 1, 'url': 1, '_id': 1 } }
        //                 ],
        //                 'as': "user"
        //             }
        //         },
        //         { $unwind: '$user' },
        //         { $skip: (page - 1) * qtdLoad },
        //         { $limit: qtdLoad }
        //     ])
        //     .catch(err => res.status(400).json(err))

        return res.json(messages)
    }
    const save = async (req, res) => {
        let { slack_msg } = req.body
        const { slack } = req.params
        const user = req.user;

        // const slackOri = await Slacks.findById(slack)
        //     .catch(err => res.status(400).json(err))
        // if (!slackOri) {
        //     return res.status(401).send('Slack inválida');
        // }
        if (!slack) {
            return res.status(400).send('O EsclaChat não foi preenchido');
        }
        if (!slack_msg || slack_msg.trim() === '') {
            return res.status(400).send('A mensagem não pode ser vazia');
        }
        slack_msg = slack_msg.trim()
        await Slacks_Messages.create({
            slack,
            user: user.id,
            postedIn: momentTz().tz("America/Sao_Paulo").format(),
            message: slack_msg
        })
            .catch(err => res.status(400).json(err))
        app.io.sockets.in(slack).emit('newMessage')

        await Users.findByIdAndUpdate(user.id, { ranking: user.ranking + 3 })
        res.status(204).send()
    }
    const remove = async (req, res) => {
        const { slack, slack_msg } = req.params
        const user = req.user;

        const slackOri = await Slacks.findById(slack)
            .catch(err => res.status(400).json(err))
        if (!slackOri) {
            return res.status(401).send('Slack inválida');
        }

        const messageToRemove = await Slacks_Messages.findById(slack_msg)
            .catch(err => res.status(400).json(err))
        if (!messageToRemove) {
            res.status(400).send("Mensagem não encontrada com o id: " + slack_msg)
        }
        if (messageToRemove.slack == slack && (messageToRemove.user == user.id || slackOri.user == user.id)) {
            await Slacks_Messages.deleteOne(messageToRemove)
                .catch(err => res.status(400).json(err))

            app.io.sockets.in(slack).emit('delMessage', messageToRemove._id)

            await Users.findByIdAndUpdate(user.id, { ranking: user.ranking - 3 })
            res.status(204).send()
        }
        else {//Se não, não tem permissão
            res.status(401).send(`Usuário ${user.name} não autorizado a deletar o comentário.`)
        }
    }

    return { index, save, remove }
}