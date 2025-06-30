const express = require("express");
const router = express.Router();
const blockController = require("../controllers/blockController");

router.post("/blockUser", blockController.blockUser);
router.post("/unblockUser", blockController.unblockUser);
router.get("/blockedUsers/:blockerId", blockController.getBlockedUsers);

module.exports = router;
