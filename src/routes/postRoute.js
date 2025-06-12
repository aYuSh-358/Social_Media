const express = require("express");
const router = express.Router();
const controller = require("../controllers/postController");
const { upload } = require("../middleware/multerConfig");

router.post("/addPost", upload.single("image"), controller.createPost);

module.exports = router;
