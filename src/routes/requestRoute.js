const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");

router.post("/sendRequest", requestController.sendRequest);
router.get("/checkStatus/:id", requestController.checkStatus);
router.put("/respondToRequest/:id", requestController.respondToRequest);
router.get("/friendList/:id", requestController.friendList);

module.exports = router;
