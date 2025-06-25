const mongoose = require("mongoose");
const Block = require("../models/blockModel");
const User = require("../models/authModels");

//  Block a user
exports.blockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        console.log(blockerId, blockedId);

        if (blockerId === blockedId) {
            return res.status(400).json({ message: "You cannot block yourself." });
        }

        const existingBlock = await Block.findOne({ blocker: blockerId, blocked: blockedId });
        if (existingBlock) {
            return res.status(400).json({ message: "User is already blocked." });
        }

        const block = new Block({ blocker: blockerId, blocked: blockedId });
        await block.save();

        return res.status(200).json({ message: "User blocked successfully." });
    } catch (error) {
        console.error("Error blocking user:", error.message);
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        console.log({ blockerId, blockedId });

        const block = await Block.findOne({ blocker: blockerId, blocked: blockedId });
        if (!block) {
            return res.status(400).json({ message: "User is not blocked." });
        }

        await Block.deleteOne({ _id: block._id });

        return res.status(200).json({ message: "User unblocked successfully." });
    } catch (error) {
        console.error("Error unblocking user:", error.message);
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};

// Get list of blocked users
exports.getBlockedUsers = async (req, res) => {
    try {
        const { blockerId } = req.params;
        console.log({ blockerId: blockerId });

        const blockedUsers = await Block.find({ blocker: blockerId }).populate("blocked", "username email");

        console.log(`Blocked users found: ${blockedUsers.length}`);
        return res.status(200).json({ blockedUsers });
    } catch (error) {
        console.error("Error fetching blocked users:", error.message);
        return res.status(500).json({ message: "Server error.", error: error.message });
    }
};
