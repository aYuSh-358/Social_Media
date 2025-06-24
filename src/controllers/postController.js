const { default: mongoose } = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/authModels");
const Comment = require("../models/postCommentsModel");
const fs = require("fs");

module.exports.createPost = async (req, res) => {
  try {
    const userId = req.params.id;
    const post = req.file;
    const { permission, caption, Event } = req.body;

    // console.log(userId, post, permission);
    if (!userId || !permission) {
      res.status(500).json({
        Status: "400",
        message: "userId, Permission is missing",
      });
    }
    let newPost = {};
    if (post) {
      newPost = new Post({
        post: post.filename,
        userId,
        permission: permission,
        caption: caption,
      });
    } else {
      newPost = new Post({
        userId,
        permission: permission,
        caption: caption,
        Event: Event,
      });
    }

    await newPost.save();
    res.status(200).json({ Status: "200", message: "Post add successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Post not Added", Error: error });
  }
};

module.exports.getPosts = async (req, res) => {
  try {
    const user = req.body;
    if (user) {
      const userId = user.id;
      if (!userId) {
        res.status(400).json({ Status: "400", message: "User Id is required" });
      }
      const userdata = await User.findById(userId);
      if (!userdata) {
        res.status(500).json({ Status: "500", message: "User not found" });
      }
      const posts = await Post.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        // {
        //   $lookup: {
        //     from: "comments",
        //     localField: "_id",
        //     foreignField: "postId",
        //     as: "comment",
        //   },
        // },
        // { $unwind: "$comment" },
      ]);

      const data = [];
      posts.map((post) => {
        data.push({
          id: post._id,
          post: `http://localhost:5000/uploads/posts/${post.post}`,
          userId: post.userId,
          LikeBy: post.likeBy,
        });
      });
      res
        .status(200)
        .json({ Status: "200", message: "User posts", data: data });
    } else {
      // if (!user) {
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
    }
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Fail to fetch the post data" });
  }
};

// module.exports.getUserPost = async (req, res) => {
//   try {
//     userId = req.params.id;
//     if (!userId) {
//       res.status(400).json({ Status: "400", message: "User Id is required" });
//     }
//     const user = await User.findById(userId);
//     if (!user) {
//       res.status(500).json({ Status: "500", message: "User not found" });
//     }

//     const posts = await Post.aggregate([
//       {
//         $match: {
//           userId: new mongoose.Types.ObjectId(userId),
//         },
//       },
//       // {
//       //   $lookup: {
//       //     from: "comments",
//       //     localField: "_id",
//       //     foreignField: "postId",
//       //     as: "comment",
//       //   },
//       // },
//       // { $unwind: "$comment" },
//     ]);

//     const data = [];
//     posts.map((post) => {
//       data.push({
//         id: post._id,
//         post: `http://localhost:5000/uploads/posts/${post.post}`,
//         userId: post.userId,
//         LikeBy: post.likeBy,
//       });
//     });
//     // console.log(data);
//     res.status(200).json({ Status: "200", message: "User posts", data: data });
//   } catch (error) {
//     res.status(500).json({
//       Status: "500",
//       message: "Problem while fetch user posts",
//       Error: error,
//     });
//   }
// };

// module.exports.getAllUserPost = async (req, res) => {
//   try {
//     const permission = "1";
//     const posts = await Post.aggregate([
//       {
//         $match: {
//           permission: permission,
//         },
//       },
//       {
//         $project: { post: 1, userId: 1 },
//       },
//     ]);

//     const data = [];
//     posts.map((post) => {
//       data.push({
//         post: `http://localhost:5000/uploads/posts/${post.post}`,
//         userId: post.userId,
//       });
//     });
//     res.status(200).json({ Status: "200", data });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ Status: "500", message: "Fail to fetch the post data" });
//   }
// };

module.exports.updatePost = async (req, res) => {
  try {
    const postId = req.body.postId;
    const postName = req.file.filename;
    const permission = req.body.permission;
    // console.log(postName, permission, postId);
    const post = await Post.findById(postId);
    // console.log(post);
    if (!post) {
      res
        .status(500)
        .message({ Status: "500", message: "Update Post Data is missing" });
    }
    const rmfile = post.post;
    if (rmfile) {
      fs.unlink(`./uploads/posts/${rmfile}`, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("File deleted successfully");
      });
    }

    post.post = postName;
    post.permission = permission || post.permission;
    await post.save();
    res
      .status(200)
      .json({ Status: "200", message: "Post updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Faild to update the post" });
  }
};

module.exports.likePosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const postId = req.body.postId;
    // console.log(userId, postId);

    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({ Status: "400", message: "Post not found" });
    }

    const alreadylike = post.likeBy.includes(userId);
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
    // console.log(req.params.id);
    const userId = req.params.id;
    const { postId, comment } = req.body;
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
    // if (!newComment) {
    //   res.status(500).json({ Status: "500", message: "No comments Found" });
    // }
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
