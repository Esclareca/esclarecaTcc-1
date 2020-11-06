const mongoose = require('mongoose');

const SlacksSchema = new mongoose.Schema({
    nome: String,
    tag: [String],
    senha: String,
    createdIn: Date,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
});

module.exports = mongoose.model('Slacks', SlacksSchema);