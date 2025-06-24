const User = require("../models/authModels");
const Story = require("../models/storyModels");

module.exports.addStory = async (req, res) => {
  try {
    const story = req.file.filename;
    const { userId, permission } = req.body;

    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      res.status(500).json({ Status: "500", message: "User not found" });
    }

    const newStory = await new Story({
      userId: userId,
      story: story,
      permission: permission,
    });
    await newStory.save();
    res
      .status(200)
      .json({ Status: "200", message: "Story Added successfully" });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getStory = async (req, res) => {
  try {
    const story = await Story.find();
    if (story.length == 0) {
      res.status(500).json({
        Status: "500",
        json: {
          Status: "500",
          message: "No story exist",
        },
      });
    }

    res.status(200).json({ Status: "200", mesage: "All Stories", story });
  } catch (error) {
    console.log(error);
  }
};
