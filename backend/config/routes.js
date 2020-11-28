const multer = require('multer');
const multerConfigProfile = require('../config/multerProfile');
const multerConfigPost = require('../config/multerPost');

module.exports = app => {
    // Tags
    app.route('/tags')
        .post(app.api.tags.save)
        .get(app.api.tags.index)

    //Login/Cadastro
    app.post('/signup', multer(multerConfigProfile).single('file'), app.api.users.save)
    app.post('/signin', app.api.auth.signin)

    //Perfil
    app.route('/users')
        .all(app.config.passport.authenticate())
        .put(app.api.users.update)
        .patch(app.api.users.patch)
    app.get('/users/:id', app.config.passport.authenticate(), app.api.users.profile)

    //Enviar a foto de perfil
    app.post('/users/:id/photo', app.config.passport.authenticate(), multer(multerConfigProfile).single('file'), app.api.users.upload)

    app.get('/users', app.config.passport.authenticate(), app.api.users.index)//Pesquisar usuário
    app.get('/users/:id/posts', app.config.passport.authenticate(), app.api.posts.getByUser)//Posts do usuário
    app.get('/users/:id/liked', app.config.passport.authenticate(), app.api.posts.getLikesByUser)//Posts curtidos pelo usuário
    app.post('/users/:id/block', app.config.passport.authenticate(), app.api.users.blockUser)//Bloquear usuário
    app.post('/users/:id/follow', app.config.passport.authenticate(), app.api.users.followUser)//Seguir usuário
    app.post('/forget', app.api.users.forgotPassword)//esqueceu a senha
    app.post('/resetPass', app.api.users.resetPassword)//resetar senha
    app.post('/pushToken', app.api.users.pushTokenPass)//salvar token push

    //ranking
    app.get('/ranking', app.config.passport.authenticate(), app.api.users.list)

    //Posts
    app.route('/posts')
        .all(app.config.passport.authenticate())
        .get(app.api.posts.index)
        .post(app.api.posts.save)
        .head(app.api.posts.getTotalPosts)

    app.get('/post/:post', app.config.passport.authenticate(), app.api.posts.getOne)//get de único post

    //Anexar no post
    app.post('/posts/:post/file', app.config.passport.authenticate(), multer(multerConfigPost).single('file'), app.api.posts.upload)

    //Dar like no post
    app.post('/posts/:post/like', app.config.passport.authenticate(), app.api.posts.like)

    //Reportar
    app.post('/posts/:post/report', app.config.passport.authenticate(), app.api.posts.report)

    //Comentários
    app.route('/posts/:post')
        .all(app.config.passport.authenticate())
        .delete(app.api.posts.remove)//Deletar post
        .get(app.api.comments.index)
        .head(app.api.comments.getTotalComments)
        .post(app.api.comments.save)

    //Dar like no post
    app.post('/posts/:post/:comm/like', app.config.passport.authenticate(), app.api.comments.like)

    //Deletar comentário
    app.route('/posts/:post/:comm')
        .all(app.config.passport.authenticate())
        .delete(app.api.comments.remove)//Deletar comentário

    //Resolver o post
    app.route('/posts/:post/:comm/solve')
        .all(app.config.passport.authenticate())
        .post(app.api.comments.solvePost)

    //Slacks
    app.route('/slacks')
        .all(app.config.passport.authenticate())
        .get(app.api.slacks.index)
        .post(app.api.slacks.save)
    app.delete('/slacks/:slack', app.config.passport.authenticate(), app.api.slacks.remove)

    //Slacks Messages
    app.route('/slacks/:slack')
        .all(app.config.passport.authenticate())
        .get(app.api.slacks_messages.index)
        .post(app.api.slacks_messages.save)
    app.delete('/slacks/:slack/:slack_msg', app.config.passport.authenticate(), app.api.slacks_messages.remove)
}
