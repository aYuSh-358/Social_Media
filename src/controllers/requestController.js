const mongoose = require("mongoose");
const friendRequest = require("../models/requestModel");
const User = require("../models/authModels");
const { sendNotification } = require('../utils/sendNotification');

// Send
exports.sendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  const { io, activeConnection } = req;

  if (senderId == receiverId) {
    return res.status(200).json({ message: "Cannot send request to yourself" });
  }

  const existing = await friendRequest.findOne({
    sender: senderId,
    receiver: receiverId,
  });

  if (existing) {
    return res.status(200).json({ message: "Friend request already sent" });
  }

  const request = new friendRequest({
    sender: senderId,
    receiver: receiverId,
    status: "pending",
  });

  await request.save();
  res.status(200).json({ message: "Friend request sent" });

  // Create notification
  await sendNotification({
    userId: receiverId,
    senderId: senderId,
    type: "follow-request",
    message: `${req.userName} sent you a friend request`,
    io,
    activeConnection

  });

};

//status
exports.checkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await friendRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "No request found" });
    }

    res.status(200).json({
      sender: request.sender,
      receiver: request.receiver,
      status: request.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Accept or Reject
exports.respondToRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { io, activeConnection } = req;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const request = await friendRequest.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  res.status(200).json({ message: `Request ${status}` });


  // Create notification for accepted request
  await sendNotification({
    userId: request.sender,
    senderId: request.receiver,
    type: "follow-accepted",
    message: `Your friend request has been ${status} by ${request.receiver}`,
    io,
    activeConnection
  });

};

//friend list
exports.friendList = async (req, res) => {
  try {
    const userId = req.params.id;

    const acceptedRequests = await friendRequest.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    });

    if (!acceptedRequests.length) {
      return res.status(200).json({ message: "No friends found" });
    }

    const friendIds = acceptedRequests.map((req) =>
      req.sender == userId ? req.receiver : req.sender
    );

    // Remove duplicates
    const uniqueFriendIds = [...new Set(friendIds)];

    const friends = await User.find({ _id: { $in: uniqueFriendIds } }).select(
      "userName userEmail"
    );

    res.status(200).json({ friends, totalFriends: friends.length });
  } catch (error) {
    console.error("Error fetching friend list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
