const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }, // the user to notify
    senderId:
    {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type:
    {
        type: String, enum: ["follow-request", "follow-accepted", "like", "comment"],
        required: true
    },
    postId:
    {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }, // only for like/comment
    seen:
    {
        type: Boolean,
        default: false
    },
    message:
    {
        type: String,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);