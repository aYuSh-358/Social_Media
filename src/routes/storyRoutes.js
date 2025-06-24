const express = require("express");
const router = express.Router();
const controller = require("../controllers/storyController");
const { upload } = require("../middleware/multerConfig");

router.post("/addStory", upload.single("story"), controller.addStory);
router.get("/getStory", controller.getStory);

module.exports = router;
