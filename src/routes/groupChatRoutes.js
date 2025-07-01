const express = require("express");
const router = express.Router();
const controller = require("../controllers/groupChatController")
const authMiddleware = require("../middleware/authMiddleware")


router.post("/createGroup", authMiddleware, controller.createGroup);
router.post("/addMember", authMiddleware, controller.addMember);
router.post("/makeAdmin", authMiddleware, controller.makeAdmin);


module.exports = router;