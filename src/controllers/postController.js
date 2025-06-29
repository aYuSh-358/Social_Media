const { default: mongoose } = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/authModels");
const Comment = require("../models/postCommentsModel");
const { sendNotification } = require("../utils/sendNotification");
const fs = require("fs");

/**
 * @swagger
 * /post/addPost/{id}:
 *   post:
 *     summary: Create a new post
 *     description: Create a post for a specific user. Supports optional file upload (e.g., image/video) and metadata like caption and event.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID for whom the post is created
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 example: public
 *               caption:
 *                 type: string
 *                 example: Beautiful sunset!
 *               Event:
 *                 type: string
 *                 example: Graduation
 *               post:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "200"
 *                 message:
 *                   type: string
 *                   example: Post add successfully
 *       400:
 *         description: Missing userId or permission
 *         content:
 *           application/json:
 *       500:
 *         description: Server error while creating post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "500"
 *                 message:
 *                   type: string
 *                   example: Post not Added
 *                 Error:
 *                   type: object
 */

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
    if (post || Event) {
    }
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

/**
 * @swagger
 * /post/getPosts:
 *   post:
 *     summary: Get posts for a specific user or public posts
 *     description: |
 *       Returns posts:
 *       - If `id` is provided in the request body, fetches posts for that user.
 *       - If not provided, returns all public posts (`permission: "1"`).
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Optional user ID to fetch user-specific posts
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: Successfully fetched posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "200"
 *                 message:
 *                   type: string
 *                   example: User posts
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 60e325b7c45b4b0015d0637f
 *                       post:
 *                         type: string
 *                         example: http://localhost:5000/uploads/posts/post.jpg
 *                       comments:
 *                         type: string
 *                         example: ""
 *                       likes:
 *                         type: string
 *                         example: ""
 *                       user:
 *                         type: string
 *                         example: John Doe
 *                       userId:
 *                         type: string
 *                         example: 60dbf9d3d1fd5c0015f6b2e0
 *                       userProfile:
 *                         type: string
 *                         example: profile.jpg
 *       400:
 *         description: Missing user ID in body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "400"
 *                 message:
 *                   type: string
 *                   example: User Id is required
 *       500:
 *         description: Server error while fetching post data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "500"
 *                 message:
 *                   type: string
 *                   example: Fail to fetch the post data
 */

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
      ]);

      const data = [];
      posts.map((post) => {
        data.push({
          id: post._id,
          post: `http://localhost:5000/uploads/posts/${post.post}`,
          comments: post.comments || "",
          likes: post.likeBy || "",
          userProfile:
            `http://localhost:5000/uploads/DP/${post.userProfilePhoto}` || "",
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
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ]);
      // console.log(posts);
      const data = [];
      posts.map((post) => {
        data.push({
          postId: post._id,
          post: `http://localhost:5000/uploads/posts/${post.post}`,
          userId: post.userId,
          comments: post.comments || "",
          likes: post.likeBy || "",
          user: post.user.userName,
          userProfile:
            `http://localhost:5000/uploads/DP/${post.user.userProfilePhoto}` ||
            "",
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

/**
 * @swagger
 * /post/updatePost:
 *   put:
 *     summary: Update a post by postId and userId
 *     description: Updates an existing post with a new file and/or permission. Validates the user and deletes the old file if replaced.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - userId
 *               - post
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *               userId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *               permission:
 *                 type: string
 *                 example: private
 *               post:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             example:
 *               Status: "200"
 *               message: Post updated successfully
 *       400:
 *         description: User not found or unauthorized
 *         content:
 *           application/json:
 *             example:
 *               Status: "400"
 *               message: Your are not the authenticated User
 *       500:
 *         description: Failed to update the post
 *         content:
 *           application/json:
 *             example:
 *               Status: "500"
 *               message: Faild to update the post
 */

module.exports.updatePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const postName = req.file.filename;
    const permission = req.body.permission;
    // console.log(postName, permission, postId);
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const post = await Post.findById(postId);
    // console.log(post);
    if (!post) {
      res
        .status(500)
        .message({ Status: "500", message: "Update Post Data is missing" });
    }
    if (post.userId.toString() != userId) {
      res.status(400).json({
        Status: "400",
        message: "Your are not the authenticated User",
      });
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

/**
 * @swagger
 * /post/likePosts/{id}:
 *   put:
 *     summary: Like or unlike a post
 *     description: Toggles like on a post by a specific user. If the user already liked the post, the like is removed.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user performing the like action
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: Like added to the post successfully
 *         content:
 *           application/json:
 *             example:
 *               Status: "200"
 *               message: Like added to the post successfully
 *       400:
 *         description: User or post not found, or like removed
 *         content:
 *           application/json:
 *             example:
 *               Status: "400"
 *               message: User like removed from the post
 *       500:
 *         description: Error while updating likes
 *         content:
 *           application/json:
 *             example:
 *               Status: "500"
 *               message: Error while updating likes
 */

module.exports.likePosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const postId = req.body.postId;
    const { io, activeConnection } = req;
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

    // Create notification
    await sendNotification({
      userId: post.userId,
      senderId: userId,
      type: "like",
      postId: post._id,
      message: `${user.userName} liked your post`,
      io,
      activeConnection,
    });
  } catch (error) {
    res.status(500).json({
      Status: "500",
      message: "Error while updating likes",
      Error: error,
    });
  }
};

/**
 * @swagger
 * /post/addComment/{id}:
 *   post:
 *     summary: Add a comment to a post
 *     description: Adds a comment to a specific post from a user and triggers a notification to the post owner.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user adding the comment
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - comment
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *               comment:
 *                 type: string
 *                 example: "Amazing post!"
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             example:
 *               Status: "200"
 *               message: Comment added successfully
 *       400:
 *         description: Missing fields or user/post not found
 *         content:
 *           application/json:
 *             example:
 *               Status: "400"
 *               message: All fields are require
 *       500:
 *         description: Server error while adding comment
 *         content:
 *           application/json:
 *             example:
 *               Status: "500"
 *               message: Fail to add comment
 */

module.exports.addComment = async (req, res) => {
  try {
    // console.log(req.params.id);
    const userId = req.params.id;
    const { io, activeConnection } = req;
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

    const newComment = { userId: userId, comment: comment };
    // if (!newComment) {
    //   res.status(500).json({ Status: "500", message: "No comments Found" });
    // }
    post.comments.push(newComment);
    await post.save();
    res
      .status(200)
      .json({ Status: "200", message: "Comment added successfully" });

    // Create notification
    await sendNotification({
      userId: post.userId,
      senderId: userId,
      type: "comment",
      postId: post._id,
      message: `${user.userName} commented on your post`,
      io,
      activeConnection,
    });
  } catch (error) {
    res
      .status(500)
      .json({ Status: "500", message: "Fail to add comment", Error: error });
  }
};

/**
 * @swagger
 * /post/deletePost:
 *   delete:
 *     summary: Delete a post by postId and userId
 *     description: Deletes a post if the user is authenticated and owns the post.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - userId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *               userId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               Status: "200"
 *               messgae: Post deleted successfully
 *       400:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               Status: "400"
 *               message: User not found
 *       500:
 *         description: Post not found or unauthorized
 *         content:
 *           application/json:
 *             examples:
 *               NotFound:
 *                 value:
 *                   Status: "500"
 *                   message: post no found
 *               Unauthorized:
 *                 value:
 *                   Status: "500"
 *                   message: You and not the authenticated user
 *               ServerError:
 *                 value:
 *                   Status: "500"
 *                   message: {}
 */

module.exports.deletePost = async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      res.status(500).json({ Status: "500", message: "post no found" });
    }
    if (post.userId.toString() !== userId) {
      res
        .status(500)
        .json({ Status: "500", message: "You and not the authenticated user" });
    }
    await Post.findByIdAndDelete(postId);
    res
      .status(200)
      .json({ Status: "200", messgae: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ Status: "500", message: error });
  }
};
