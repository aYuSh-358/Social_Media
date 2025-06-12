const mongoose = require("mongoose");

const postLikesSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    require: true,
  },
  userId: {
    type: [String],
    require: true,
  },
  //    userId: {
  //     type: [mongoose.Schema.Types.ObjectId()],
  //     ref: "User"
  //     require: true,
  //   },
});

module.exports = mongoose.model("postLikes", postLikesSchema);
