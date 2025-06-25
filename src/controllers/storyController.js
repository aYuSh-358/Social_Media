const { default: mongoose, model } = require("mongoose");
const User = require("../models/authModels");
const Story = require("../models/storyModels");
const friendRequest = require("../models/requestModel");

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

module.exports.viewStory = async (req, res) => {
  try {
    const { userId, storyId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(400).json({ Status: "400", message: "User not found" });
    }
    const story = await Story.findById(storyId);
    if (!story) {
      res.status(400).json({ Status: "400", message: "Story not found" });
    }
    if ((story.userId = userId)) {
      res.status(204).json({ message: "You viewed your own story" });
    }
    let alreadyView = story.viewBy.includes(userId);
    if (alreadyView) {
      res.status(204);
    } else {
      story.viewBy.push(userId);
      await story.save();
    }
    res.status(201).json({ Status: "201", message: "View Story" });
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
