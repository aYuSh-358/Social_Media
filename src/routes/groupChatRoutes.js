const express = require("express");
const router = express.Router();
const controller = require("../controllers/groupChatController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/createGroup", controller.createGroup);
router.post("/addMember", controller.addMember);
router.post("/makeAdmin", controller.makeAdmin);
router.get("/memberList/:id", controller.memberList);
router.post("/leaveGroup", controller.leaveGroup);
router.post("/removeMember", controller.removeMember);

// router.post("/createGroup", authMiddleware, controller.createGroup);
// router.post("/addMember", authMiddleware, controller.addMember);
// router.post("/makeAdmin", authMiddleware, controller.makeAdmin);
// router.get("/memberList/:id", controller.memberList);
// router.post("/leaveGroup", authMiddleware, controller.leaveGroup);
// router.post("/removeMember", authMiddleware, controller.removeMember);

module.exports = router;
