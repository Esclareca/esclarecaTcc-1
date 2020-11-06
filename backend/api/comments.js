var momentTz = require('moment-timezone');
const mongoose = require('mongoose');

const Users = require('../models/Users');
const Posts = require('../models/Posts');
const Posts_Comments = require('../models/Posts_Comments');

module.exports = app => {
    const getTotalComments = async (req, res) => {
        const { post } = req.params;
        const user = req.user;

        const postOri = await Posts.findById(post)
            .catch(err => res.status(400).json(err))
        if (!postOri) {
            return res.status(401).send('Post inválido');
        }
        const count = await Posts_Comments.find({ post, user: { $nin: user.blocked } }).countDocuments()

        res.header('X-Total-Count', count)
        return res.json(count)
    }

    const index = async (req, res) => {
        const { post } = req.params;
        //Páginação
        const qtdLoad = 5
        const { page = 1 } = req.query
        const user = req.user;

        const postOri = await Posts.findById(post)
            .catch(err => res.status(400).json(err))
        if (!postOri) {
            return res.status(401).send('Post inválido');
        }

        const count = await Posts_Comments.find({ post, user: { $nin: user.blocked } }).countDocuments()

        res.header('X-Total-Count', count)

        const comments = await Posts_Comments
            .aggregate([
                { $match: { post: postOri._id, user: { $nin: user.blocked } } },
                { $sort: { solvedPost: -1, postedIn: 1 } },
                {
                    "$addFields": {
                        "didILiked": {
                            "$in": [mongoose.Types.ObjectId(user.id), "$likes"]
                        }
                    }
                },
                { $skip: (page - 1) * qtdLoad },
                { $limit: qtdLoad },
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
                            { '$project': { 'name': 1, 'url': 1, '_id': 1 } }
                        ],
                        'as': "user"
                    }
                },
                { $unwind: '$user' },
                // { $lookup: { from: 'users', localField: 'likes', foreignField: '_id', as: 'likes' } },
            ])
            .catch(err => { return res.status(400).json(err) })

        return res.json(comments)
    }

    const save = async (req, res) => {
        //const { filename } = req.file;
        let { message } = req.body
        const { post } = req.params
        const user = req.user;

        if (!post) {
            return res.status(400).send('O post não foi preenchido');
        }
        if (!message || message.trim() == '') {
            return res.status(400).send('A mensagem não foi preenchida corretamente');
        }
        message = message.trim()
        await Posts_Comments.create({
            post,
            user: user.id,
            postedIn: momentTz().tz("America/Sao_Paulo").format(),
            message,
            solvedPost: false,
        })
            .catch(err => res.status(400).json(err))
        if (user.ranking === NaN || user.ranking === undefined) {
            value = 3
        }
        else {
            value = user.ranking + 3
        }
        await Users.findByIdAndUpdate(user.id, { ranking: value })
        return res.status(204).send()
    }

    const remove = async (req, res) => {
        const { post, comm } = req.params
        const user = req.user;

        const commentToDelete = await Posts_Comments.findById(comm)
            .catch(err => res.status(400).json(err))//Caso o id seja inválido vai cair aqui
        if (!commentToDelete) { res.status(400).send("Comentário não encontrado com o id: " + comm) }//Caso o id seja válido mas não exista vai cair aqui

        if (commentToDelete.post._id == post || commentToDelete.user == user.id) {//Se é o post certo e o dono do comentário deleta
            await Posts_Comments.deleteOne(commentToDelete)
                .catch(err => res.status(400).json(err))

            if (user.ranking === NaN || user.ranking === undefined) {
                value = 0
            }
            else {
                value = user.ranking - 3
            }
            await Users.findByIdAndUpdate(user.id, { ranking: value })

            return res.status(204).send()
        } else {//Se não, não tem permissão
            res.status(401).send(`Usuário ${user.name} não autorizado a deletar o comentário.`)
        }

    }

    const like = async (req, res) => {
        const { comm } = req.params;
        const user = req.user;

        const commToUpdate = await Posts_Comments.findById(comm)
            .catch(err => res.status(400).json(err))//Caso o id seja inválido vai cair aqui
        if (!commToUpdate) {//Caso o id seja válido mas não exista vai cair aqui
            res.status(400).send("Comentário não encontrado com o id: " + req.params.comm)
        } else {
            if (commToUpdate.likes.find(u => u == user.id)) {//Descurtindo

                const index = commToUpdate.likes.indexOf(user.id);
                if (index > -1) {
                    commToUpdate.likes.splice(index, 1);
                }
                await commToUpdate.save()
                    .catch(err => res.status(400).json(err))
                res.status(201).send()
            }
            else {//Curtindo
                commToUpdate.likes.push(user.id)
                await commToUpdate.save()
                    .catch(err => res.status(400).json(err))

                res.status(204).send()
            }
        }
    }

    const solvePost = async (req, res) => {
        const { comm } = req.params;
        const user = req.user;

        //Busca do comentário
        const commentToUpdate = await Posts_Comments.findById(comm)
            .catch(err => res.status(400).json(err))//Caso o id seja inválido vai cair aqui
        if (!commentToUpdate) {
            return res.status(400).send("Comentário não encontrado com o id: " + req.params)
        } else {//Caso encontre o comentário, entra para as modificações
            //Validação de post
            const postToUpdate = await Posts.findById(commentToUpdate.post)
                .catch(err => res.status(400).json(err))//Caso o id seja inválido vai cair aqui
            if (!postToUpdate) {//Caso o id seja válido mas não exista vai cair aqui
                return res.status(400).send("Post não encontrado com o id: " + req.params)
            } else {
                if (postToUpdate.solved == true) {
                    return res.status(200).send("Post já solucionado por outro comentário")//Caso já esteja resolvido, envia uma requisição vazia
                }
            }

            if (commentToUpdate.solvedPost == true) {
                return res.status(204).send()//Caso já esteja resolvido, envia uma requisição vazia
            } else {
                //Soluciona o comentário
                commentToUpdate.solvedPost = true
                commentToUpdate.save()
                    .catch(err => res.status(400).json(err))
                //Soluciona o post
                postToUpdate.solved = true
                await postToUpdate.save()
                    .catch(err => res.status(400).json(err))

                if (user.ranking === NaN || user.ranking === undefined) {
                    value = 10
                }
                else {
                    value = user.ranking + 10
                }
                await Users.findByIdAndUpdate(user.id, { ranking: value })
            }
            return res.status(201).send()
        }
    }

    return { index, getTotalComments, save, remove, like, solvePost }
}