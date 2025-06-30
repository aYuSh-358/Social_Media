const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatController");

router.get("/userchat/:sender_id/:receiver_id", controller.getMessages);

module.exports = router;
