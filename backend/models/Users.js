// const mongoose = require('mongoose');
// var Users = new mongoose.Schema({
//     _id: {
//         type: Number
//     },
//     name: {
//         type: String
//     },
//     email: {
//         type: String
//     },
//     password: {
//         type: String
//     },
//     userPhoto: {
//         type: Schema.Types.Mixed
//     }
// });

// const UsersClass = mongoose.model('Users', Users);
// module.exports = UsersClass;
const { hostIp } = require('../.env')

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tags'
    }],
    key: String,
    url: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    ranking: Number,
    blocked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    followed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    pushToken: String,
    idGoogle: String,
    idFacebook: String,
    hashForgot: String,
    hashExpiresAt: Date
});

UserSchema.pre("save", function () {
    if (!this.url) {
        if (this.key) {
            this.url = `http:${hostIp}:3333/files/${this.key}`;//coloca AQUI seu localhost
        }
    }
})

module.exports = mongoose.model('Users', UserSchema);