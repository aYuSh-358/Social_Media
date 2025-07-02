const Chat = require("../models/chatModels");
const User = require("../models/authModels");
const { mongoose } = require("mongoose");

/**
 * @swagger
 * /chat/userchat/{sender_id}/{receiver_id}:
 *   get:
 *     summary: Get messages between two users
 *     description: Fetches all messages exchanged between the sender and receiver.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: sender_id
 *         required: true
 *         description: ID of the sender
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *       - in: path
 *         name: receiver_id
 *         required: true
 *         description: ID of the receiver
 *         schema:
 *           type: string
 *           example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: User chats fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               Status: "200"
 *               message: User chats
 *               data:
 *                 - senderId: "60dbf9d3d1fd5c0015f6b2e0"
 *                   receiverId: "60f5a3f3a7f9d50015c2e123"
 *                   text: "Hey there!"
 *       400:
 *         description: Sender or receiver not found
 *         content:
 *           application/json:
 *             examples:
 *               SenderNotFound:
 *                 value:
 *                   Status: "400"
 *                   message: Sender not found
 *               ReceiverNotFound:
 *                 value:
 *                   Status: "400"
 *                   message: Reciver not found
 *       500:
 *         description: Messages not found or server error
 *         content:
 *           application/json:
 *             examples:
 *               MessagesMissing:
 *                 value:
 *                   Status: "500"
 *                   message: Messages not found
 *               ServerError:
 *                 value:
 *                   Status: "500"
 *                   message: Error while fetching messages
 */

// module.exports.getMessages = async (req, res) => {
//   try {
//     const { sender_id, receiver_id } = req.params;
//     console.log("hiii", sender_id, receiver_id);
//     const sender = await User.findById(sender_id);
//     if (!sender) {
//       res.status(400).json({ Status: "400", message: "Sender not found" });
//     }
//     const reciver = await User.findById(receiver_id);
//     if (!reciver) {
//       res.Status(400).json({ Status: "400", message: " Reciver not found" });
//     }

//     const message = await Chat.aggregate([
//       {
//         $match: {
//           $or: [{ senderId: sender_id }, { receiverId: sender_id }],
//         },
//       },
//     ]);

//     console.log("messagae", message);
//     if (message.length == 0) {
//       res.status(500).json({ Status: "500", message: " Messages not found" });
//     }
//     res
//       .status(200)
//       .json({ Status: "200", message: "User chats", data: message });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       Status: "500",
//       message: "Error while fetching messages",
//       Error: error,
//     });
//   }
// };

// module.exports.getMessages = async (req, res) => {
//   try {
//     const { sender_id, receiver_id } = req.params;

//     // console.log(
//     //   "Fetching messages for sender:",
//     //   sender_id,
//     //   "and receiver:",
//     //   receiver_id
//     // );

//     const sender = await User.findById(sender_id);
//     if (!sender) {
//       return res
//         .status(404)
//         .json({ Status: "404", message: "Sender not found" });
//     }

//     const receiver = await User.findById(receiver_id);
//     if (!receiver) {
//       return res
//         .status(404)
//         .json({ Status: "404", message: "Receiver not found" });
//     }

//     const messages = await Chat.aggregate([
//       {
//         $match: {
//           senderId: sender_id,
//           receiverId: receiver_id,
//         },
//       },
//     ]);

//     // console.log("Fetched messages:", messages);

//     if (messages.length === 0) {
//       return res.status(200).json({
//         Status: "200",
//         message: "No messages found for this conversation.",
//         data: [],
//       });
//     }

//     res
//       .status(200)
//       .json({ Status: "200", message: "User chats", data: messages });
//   } catch (error) {
//     console.error("Error while fetching messages:", error);
//     res.status(500).json({
//       Status: "500",
//       message: "Error while fetching messages",
//       Error: error.message,
//     });
//   }
// };

module.exports.getMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.params;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        Status: "400",
        message: "Sender ID and Receiver ID are required.",
      });
    }

    const sender = await User.findById(sender_id);
    if (!sender) {
      return res
        .status(404)
        .json({ Status: "404", message: "Sender not found." });
    }
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res
        .status(404)
        .json({ Status: "404", message: "Receiver not found." });
    }

    const messages = await Chat.aggregate([
      {
        $match: {
          $or: [
            { senderId: sender_id, receiverId: receiver_id },
            { senderId: receiver_id, receiverId: sender_id },
          ],
        },
      },
      {
        $sort: { createdAt: 1 },
      },
    ]);

    if (messages.length === 0) {
      return res.status(200).json({
        Status: "200",
        message: "No messages found between these users.",
        data: [],
      });
    }

    res.status(200).json({
      Status: "200",
      message: "User chats retrieved successfully.",
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      Status: "500",
      message: "Internal Server Error while fetching messages.",
      Error: error.message,
    });
  }
};
