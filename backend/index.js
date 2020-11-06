require('dotenv').config();

const express = require('express')
const app = express()

// var server = app.listen(process.env.PORT || 3333);
var server = app.listen(process.env.PORT || 3333, () => {
    console.log('backend log')
})
var io = require('socket.io').listen(server);


const db = require('./config/db')
const consign = require('consign')
const morgan = require('morgan')
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/files', express.static(path.resolve(__dirname, '.', 'tmp', 'uploads')))

//consign().include('./config/passport.js').then('./config/middlewares.js').then('./api').then('./config/routes.js').into(app)
consign()
    .include('./config/passport.js')
    .then('./api')//controllers
    .then('./config/middlewares.js')
    .then('./config/routes.js')//config das rotas
    .into(app)//inserir os then acima na variavel app

app.db = db
app.io = io

io.sockets.on("connection", socket => {
    console.log("a user connected :D");
    // console.log(socket)
    socket.on("chat", msg => {
        console.log(msg);
        // io.emit("chat", msg);
    });
    socket.on('join', room=>{
        console.log("room:"+room)
        socket.join(room)
    })
    
});
