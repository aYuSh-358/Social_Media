const Chat = require("../models/chatModels");
const User = require("../models/authModels");
const { mongoose } = require("mongoose");

module.exports.getMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.params;
    console.log(sender_id, receiver_id);
    const sender = await User.findById(sender_id);
    if (!sender) {
      res.status(400).json({ Status: "400", message: "Sender not found" });
    }
    const reciver = await User.findById(receiver_id);
    if (!reciver) {
      res.Status(400).json({ Status: "400", message: " Reciver not found" });
    }

    const message = await Chat.aggregate([
      {
        $match: {
          senderId: sender_id,
          receiverId: receiver_id,
        },
      },
    ]);

    console.log(message);
    if (message.length == 0) {
      res.status(500).json({ Status: "500", message: " Messages not found" });
    }
    res
      .status(200)
      .json({ Status: "200", message: "User chats", data: message });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      Status: "500",
      message: "Error while fetching messages",
      Error: error,
    });
  }
};

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
