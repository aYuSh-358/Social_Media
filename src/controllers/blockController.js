const mongoose = require("mongoose");
const Block = require("../models/blockModel");
const User = require("../models/authModels");

/**
 * @swagger
 * /block/blockUser:
 *   post:
 *     summary: Block a user
 *     description: Allows a user to block another user. Prevents self-blocking and duplicate blocks.
 *     tags:
 *       - Request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockerId
 *               - blockedId
 *             properties:
 *               blockerId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *               blockedId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: User blocked successfully
 *         content:
 *           application/json:
 *             example:
 *               message: User blocked successfully.
 *       400:
 *         description: Invalid request (e.g. self-blocking or duplicate block)
 *         content:
 *           application/json:
 *             examples:
 *               SelfBlock:
 *                 value:
 *                   message: You cannot block yourself.
 *               AlreadyBlocked:
 *                 value:
 *                   message: User is already blocked.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error.
 *               error: "Error message"
 */

exports.blockUser = async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;
    console.log(blockerId, blockedId);

    if (blockerId === blockedId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const existingBlock = await Block.findOne({
      blocker: blockerId,
      blocked: blockedId,
    });
    if (existingBlock) {
      return res.status(400).json({ message: "User is already blocked." });
    }

    const block = new Block({ blocker: blockerId, blocked: blockedId });
    await block.save();

    return res.status(200).json({ message: "User blocked successfully." });
  } catch (error) {
    console.error("Error blocking user:", error.message);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

/**
 * @swagger
 * /bolock/unblockUser:
 *   post:
 *     summary: Unblock a user
 *     description: Allows a user to unblock someone they have previously blocked.
 *     tags:
 *       - Request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockerId
 *               - blockedId
 *             properties:
 *               blockerId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *               blockedId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *         content:
 *           application/json:
 *             example:
 *               message: User unblocked successfully.
 *       400:
 *         description: User is not blocked
 *         content:
 *           application/json:
 *             example:
 *               message: User is not blocked.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error.
 *               error: "Error message"
 */

exports.unblockUser = async (req, res) => {
  try {
    const { blockerId, blockedId } = req.body;
    console.log({ blockerId, blockedId });

    const block = await Block.findOne({
      blocker: blockerId,
      blocked: blockedId,
    });
    if (!block) {
      return res.status(400).json({ message: "User is not blocked." });
    }

    await Block.deleteOne({ _id: block._id });

    return res.status(200).json({ message: "User unblocked successfully." });
  } catch (error) {
    console.error("Error unblocking user:", error.message);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};

// Get list of blocked users
/**
 * @swagger
 * /block/blockedUsers/{blockerId}:
 *   get:
 *     summary: Get list of users blocked by a specific user
 *     description: Retrieves all users that have been blocked by the provided blocker user ID.
 *     tags:
 *       - Request
 *     parameters:
 *       - in: path
 *         name: blockerId
 *         required: true
 *         description: ID of the user who blocked others
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: List of blocked users
 *         content:
 *           application/json:
 *             example:
 *               blockedUsers:
 *                 - blocked:
 *                     username: johndoe
 *                     email: johndoe@example.com
 *       500:
 *         description: Server error while fetching blocked users
 *         content:
 *           application/json:
 *             example:
 *               message: Server error.
 *               error: "Error message"
 */

exports.getBlockedUsers = async (req, res) => {
  try {
    const { blockerId } = req.params;
    console.log({ blockerId: blockerId });

    const blockedUsers = await Block.find({ blocker: blockerId }).populate(
      "blocked",
      "username email"
    );

    console.log(`Blocked users found: ${blockedUsers.length}`);
    return res.status(200).json({ blockedUsers });
  } catch (error) {
    console.error("Error fetching blocked users:", error.message);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};
