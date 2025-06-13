const express = require("express");
const router = express.Router();
const controller = require("../controllers/postController");
const { upload } = require("../middleware/multerConfig");
const verifyToken = require("../middleware/authMiddleware");

router.post(
  "/addPost/:id",
  verifyToken,
  upload.single("post"),
  controller.createPost
);
router.all("/getPosts", verifyToken, controller.getPosts);
// router.get("/getUserPost/:id", verifyToken, controller.getUserPost);
// router.get("/getAllUserPost", verifyToken, controller.getAllUserPost);
router.post("/likePosts/:id", verifyToken, controller.likePosts);
router.post("/addComment/:id", verifyToken, controller.addComment);
router.put(
  "/updatePost",
  verifyToken,
  upload.single("post"),
  controller.updatePost
);

module.exports = router;
