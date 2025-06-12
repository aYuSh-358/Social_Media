const { default: mongoose } = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Comment = require("../models/postCommentsModel");

module.exports.createPost = async (req, res) => {
  try {
    const userId = req.params.id;
    const post = req.file;
    const permission = req.body.permission;
    console.log(userId, post, permission);
    if (!userId || !post || !permission) {
      res.status(500).json({
        Status: "400",
        message: "userId, Post, Permission is missing",
      });
    }
    const newPost = new Post({
      post: post.filename,
      userId,
      permission: permission,
    });
    await newPost.save();
    res.status(200).json({ Status: "200", message: "Post add successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Post not Added", Error: error });
  }
};

module.exports.getUserPost = async (req, res) => {
  try {
    userId = req.params.id;
    if (!userId) {
      res.status(400).json({ Status: "400", message: "User Id is required" });
    }
    const users = await User.findById(userId);

    if (!users) {
      res.status(500).json({ Status: "500", message: "User not found" });
    }

    const posts = await Post.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
    ]);

    if (posts.length == 0) {
      res
        .status(500)
        .json({ Status: "500", message: "No posts found for the users" });
    }
    const data = [];
    posts.map((post) => {
      data.push({
        id: post._id,
        post: `http://localhost:5000/uploads/posts/${post.post}`,
        userId: post.userId,
        LikeBy: post.likeBy,
      });
    });
    // console.log(data);
    res.status(200).json({ Status: "200", message: "User posts", data: data });
  } catch (error) {
    res.status(500).json({
      Status: "500",
      message: "Problem while fetch user posts",
      Error: error,
    });
  }
};

module.exports.getAllUserPost = async (req, res) => {
  try {
    const permission = "1";
    const posts = await Post.aggregate([
      {
        $match: {
          permission: permission,
        },
      },
      {
        $project: { post: 1, userId: 1 },
      },
    ]);

    const data = [];
    posts.map((post) => {
      data.push({
        post: `http://localhost:5000/uploads/posts/${post.post}`,
        userId: post.userId,
      });
    });
    res.status(200).json({ Status: "200", data });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Fail to fetch the post data" });
  }
};

module.exports.likePosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const postId = req.body.postId;
    console.log(userId, postId);

    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ Status: "400", message: "Post not found" });
    }

    const alreadylike = post.likeBy.includes(userId);
    // if (alreadylike) {
    //   res
    //     .status(400)
    //     .json({ Status: "400", message: "User already like the post" });
    // }
    if (alreadylike) {
      post.likeBy.pull(userId);
      await post.save();
      res
        .status(400)
        .json({ Status: "400", message: "User like removed from the post" });
    } else post.likeBy.push(userId);
    await post.save();
    res
      .status(200)
      .json({ Status: "200", message: "Like added to the post successfully" });
  } catch (error) {
    res.status(500).json({
      Status: "500",
      message: "Error while updating likes",
      Error: error,
    });
  }
};

module.exports.addComment = async (req, res) => {
  try {
    const userId = req.params.id;
    const { postId, comment } = req.body;
    console.log(comment);
    if (!userId || !postId || !comment) {
      res
        .status(400)
        .json({ Status: "400", message: "All fields are require" });
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ Status: "400", message: "Post not found" });
    }

    const newComment = new Comment({ userId, postId, comment });
    if (!newComment) {
      res.status(500).json({ Status: "500", message: "No comments Found" });
    }

    await newComment.save();
    res
      .status(200)
      .json({ Status: "200", message: "Comment added successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Fail to add comment", Error: error });
  }
};
