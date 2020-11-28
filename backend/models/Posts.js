// var Posts = new Schema({
//     _id: {
//         type: Number
//     },
//     title: {
//         type: String
//     },
//     desc: {
//         type: String
//     },
//     userId: {
//         type: Schema.Types.ObjectId
//     },
//     type: {
//         type: Boolean
//     },
//     closed: {
//         type: Boolean
//     }
// });

const mongoose = require("mongoose");

const PostsSchema = new mongoose.Schema({
  title: String,
  desc: String,
  postedIn: Date,
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tags'
  }],
  type: Boolean,
  solved: Boolean,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],
  files: [{ name: String, format: String, url: String, date: Date }],
});

module.exports = mongoose.model("Posts", PostsSchema);
