const { default: mongoose, model } = require("mongoose");
const User = require("../models/authModels");
const Story = require("../models/storyModels");
const friendRequest = require("../models/requestModel");

/**
 * @swagger
 * /story/addStory/{id}:
 *   post:
 *     summary: Add a new story
 *     description: Uploads a story (image or video) for a user with optional permissions and status flags.
 *     tags:
 *       - Stories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user adding the story
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
 *               - story
 *             properties:
 *               story:
 *                 type: string
 *                 format: binary
 *               permissions:
 *                 type: string
 *                 enum: ["0", "1", "2"]
 *                 example: "2"
 *                 description: '0: private, 1: friends, 2: public'
 *               status:
 *                 type: string
 *                 enum: ["0", "1"]
 *                 example: "1"
 *                 description: '0: inactive, 1: active'
 *     responses:
 *       200:
 *         description: Story added successfully
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
 *                   example: Story Added successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "404"
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
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
 *                   example: Internal server error
 */
module.exports.addStory = async (req, res) => {
  try {
    const story = req.file.filename;

    const userId = req.params.id;
    const { permission, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(500).json({ Status: "500", message: "User not found" });
    }

    const newStory = await new Story({
      userId: userId,
      story: story,
      permission: permission,
      status: status,
    });
    await newStory.save();
    res
      .status(200)
      .json({ Status: "200", message: "Story Added successfully" });
  } catch (error) {
    console.log(error);
  }
};

/**
 * @swagger
 * /story/getStoriesForUser/{id}:
 *   get:
 *     summary: Get stories for a specific user
 *     description: Retrieves all active stories of the user's friends based on accepted friend requests.
 *     tags:
 *       - Stories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to get stories for
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: Successfully fetched the stories
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
 *                   example: All Stories
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           userName:
 *                             type: string
 *                             example: John Doe
 *                       storyId:
 *                         type: string
 *                         example: 60f5a3f3a7f9d50015c2e123
 *                       story:
 *                         type: string
 *                         example: http://localhost:5000/uploads/story/60dbf9d3d1fd5c0015f6b2e0/story.jpg
 *       404:
 *         description: No active stories found for friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "404"
 *                 message:
 *                   type: string
 *                   example: No active stories found for your friends.
 *       500:
 *         description: Internal server error
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
 *                   example: Internal Server Error
 */
module.exports.getStoriesForUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const acceptedRequests = await friendRequest.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    });

    if (!acceptedRequests.length) {
      return res.status(200).json({ message: "No Stories exist" });
    }

    const friendIds = acceptedRequests.map((req) =>
      req.sender == userId ? req.receiver : req.sender
    );

    const uniqueFriendIds = [...new Set(friendIds)];

    const friends = await Story.find({
      userId: { $in: uniqueFriendIds },
    }).select(`story userId status`);

    const storyDataPromises = friends.map(async (friend) => {
      if (friend.status == "1") {
        const existUser = await User.aggregate([
          {
            $match: {
              _id: friend.userId,
            },
          },
          {
            $project: {
              _id: 0,
              userName: 1,
            },
          },
        ]);
        if (existUser && existUser.length > 0) {
          return {
            user: existUser[0], // Access the first element of the aggregation result
            storyId: friend._id,
            story: `http://localhost:5000/uploads/story/${friend.userId}/${friend.story}`,
          };
        }
      }
      return null;
    });

    let data = await Promise.all(storyDataPromises);
    data = data.filter((item) => item !== null);

    if (data.length > 0) {
      return res
        .status(200)
        .json({ Status: "200", message: "All Stories", data });
    } else {
      return res.status(200).json({
        Status: "200",
        message: "No active stories found for your friends.",
      });
    }
  } catch (error) {
    console.error("Error in getStoriesForUser:", error);
    return res
      .status(500)
      .json({ Status: "500", message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /story/archiveStory/{id}:
 *   get:
 *     summary: Get archived stories for a user
 *     description: Fetches all stories created by a specific user (archives).
 *     tags:
 *       - Stories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user whose stories are being retrieved
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: User stories retrieved successfully
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
 *                   example: All user Stories
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60f5a3f3a7f9d50015c2e123
 *                       userId:
 *                         type: string
 *                         example: 60dbf9d3d1fd5c0015f6b2e0
 *                       story:
 *                         type: string
 *                         example: story.jpg
 *       404:
 *         description: No stories exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "404"
 *                 message:
 *                   type: string
 *                   example: No story exist
 *       500:
 *         description: Server error
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
 *                   example: Internal Server Error
 */
module.exports.archiveStory = async (req, res) => {
  const userId = req.params.id;
  try {
    const story = await Story.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
    ]);
    console.log(story);
    if (story.length == 0) {
      res.status(500).json({
        Status: "500",
        message: {
          Status: "500",
          message: "No story exist",
        },
      });
    }
    res
      .status(200)
      .json({ Status: "200", mesage: "All user Stories", data: story });
  } catch (error) {
    console.log(error);
  }
};

/**
 * @swagger
 * /story/viewStory:
 *   post:
 *     summary: Mark a story as viewed by a user
 *     description: Tracks that a user has viewed another user's story. Ignores self-views and prevents duplicate entries.
 *     tags:
 *       - Stories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storyId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *               storyId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       201:
 *         description: Story viewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "201"
 *                 message:
 *                   type: string
 *                   example: Story viewed successfully.
 *       200:
 *         description: Self view or already viewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You viewed your own story.
 *       404:
 *         description: User or Story not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "404"
 *                 message:
 *                   type: string
 *                   example: User not found.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "500"
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred.
 */
module.exports.viewStory = async (req, res) => {
  try {
    const { userId, storyId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "404", message: "User not found." });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res
        .status(404)
        .json({ status: "404", message: "Story not found." });
    }

    if (story.userId.equals(userId)) {
      return res.status(200).json({ message: "You viewed your own story." });
    }

    const alreadyViewed = story.viewBy.includes(userId);
    // console.log(alreadyViewed);

    if (alreadyViewed) {
      return res.status(200).json({ message: "Story already viewed." });
    } else {
      story.viewBy.push(userId);
      await story.save();
      return res
        .status(201)
        .json({ status: "201", message: "Story viewed successfully." });
    }
  } catch (error) {
    console.error("Error viewing story:", error);
    return res
      .status(500)
      .json({ status: "500", message: "An unexpected error occurred." });
  }
};
/**
 * @swagger
 * /story/deleteStory/{id}:
 *   delete:
 *     summary: Delete a story by storyId and userId
 *     description: Deletes a story from the system based on user and story IDs.
 *     tags:
 *       - Stories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user requesting deletion
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
 *               - storyId
 *             properties:
 *               storyId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: Story deleted successfully
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
 *                   example: Story deleted Successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Status:
 *                   type: string
 *                   example: "404"
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error while deleting story
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
 *                   example: Internal Server Error
 */

module.exports.deleteStory = async (req, res) => {
  try {
    const userId = req.params.id;
    const storyId = req.body.storyId;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: " User not found" });
    }
    const story = await Story.findByIdAndDelete(storyId);
    res
      .status(200)
      .json({ Status: "200", message: "Story deleted Successfully" });
  } catch (error) {
    res.status(500).json({ Status: "500", message: error });
  }
};

// module.exports.getStory = async (req, res) => {
//   try {
//     const story = await Story.aggregate([
//       {
//         $match: {
//           status: "1",
//         },
//       },
//     ]);
//     console.log(story);
//     if (story.length == 0) {
//       res.status(500).json({
//         Status: "500",
//         message: {
//           Status: "500",
//           message: "No story exist",
//         },
//       });
//     }
//     res.status(200).json({ Status: "200", mesage: "All Stories", data: story });
//   } catch (error) {
//     console.log(error);
//   }
// };

// module.exports.getStoriesForUser = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const acceptedRequests = await friendRequest.find({
//       status: "accepted",
//       $or: [{ sender: userId }, { receiver: userId }],
//     });

//     if (!acceptedRequests.length) {
//       return res.status(200).json({ message: "No Stories exist" });
//     }
//     const friendIds = acceptedRequests.map((req) =>
//       req.sender == userId ? req.receiver : req.sender
//     );

//     // Remove duplicates
//     const uniqueFriendIds = [...new Set(friendIds)];
//     let data = [];

//     const friends = await Story.find({
//       userId: { $in: uniqueFriendIds },
//     }).select(`story userId status`);
//     let existUser = "";
//     friends.map(async (friend) => {
//       if (friend.status == "1") {
//         existUser = await User.aggregate([
//           {
//             $match: {
//               _id: friend.userId,
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               userName: 1,
//             },
//           },
//         ]);
//         console.log(existUser);
//         data.push({
//           user: existUser,
//           post: `http://localhost:5000/uploads/story/${friend.userId}/${friend.story}`,
//         });
//       }
//       console.log(data);
//       res.status(200).json({ Status: "200", message: "All Stories", data });
//     });
//     res.status(500).json({ Status: "500", message: "Unknown error" });
//   } catch (error) {
//     console.log(error);
//   }
// };

// const acceptedRequests = await friendRequest.find({
//       status: "accepted",
//       $or: [{ sender: userId }, { receiver: userId }],
//     });

//     if (!acceptedRequests.length) {
//       return res.status(200).json({ message: "No friends found" });
//     }

//     const friendIds = acceptedRequests.map((req) =>
//       req.sender == userId ? req.receiver : req.sender
//     );

//     // Remove duplicates
//     const uniqueFriendIds = [...new Set(friendIds)];

//     const friends = await User.find({ _id: { $in: uniqueFriendIds } }).select(
//       "userName userEmail"
//     );
