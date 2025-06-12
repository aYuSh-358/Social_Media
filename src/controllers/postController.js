const Post = require("../models/postModel");

module.exports.createPost = async (req, res) => {
  try {
    const userId = req.params.id;
    const post = req.file;

    if (!userId || !post) {
      res
        .status(500)
        .json({ Status: "400", message: "userId or Post is missing" });
    }

    const newPost = new Post({
      post: post.filename,
      userId,
    });
    await newPost.save();
    res.Status(200).json({ Status: "200", message: "Post add successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Post not Added", Error: error });
  }
};
