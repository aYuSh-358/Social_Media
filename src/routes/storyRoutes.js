const express = require("express");
const router = express.Router();
const controller = require("../controllers/storyController");
const { upload } = require("../middleware/multerConfig");
const verifyToken = require("../middleware/authMiddleware");

router.post(
  "/addStory/:id",
  verifyToken,
  upload.single("story"),
  controller.addStory
);
router.get("/getStoriesForUser/:id", verifyToken, controller.getStoriesForUser);
router.get("/archiveStory/:id", verifyToken, controller.archiveStory);
router.post("/viewStory", verifyToken, controller.viewStory);

module.exports = router;
