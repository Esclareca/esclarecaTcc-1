const mongoose = require('mongoose');

const SlacksSchema = new mongoose.Schema({
    nome: String,
    tag: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tags'
    }],
    senha: String,
    createdIn: Date,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
});

module.exports = mongoose.model('Slacks', SlacksSchema);