var mongoose = require('mongoose');
var requestSchema = new mongoose.Schema({
    sender: {
        type: String,

    },
    reciever: {
        type: String,

    },
    status: {
        type: String,

    },
    // companyId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Company",
    //   required: [true],
    // }


});

module.exports = mongoose.model('friendRequest', requestSchema);



