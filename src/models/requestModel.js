var mongoose = require('mongoose');
var requestSchema = new mongoose.Schema({
    sender: {
        type: String,

    },
    receiver: {
        type: String,

    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
        required: true
    }

});

module.exports = mongoose.model('friendRequest', requestSchema);
