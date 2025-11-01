const mongoose = require('mongoose');
const messageSchema = mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId, // Đổi sang ObjectId để tham chiếu
            ref: 'Rooms', // Tham chiếu đến Model Room
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId, // Đổi sang ObjectId để tham chiếu
            ref: 'Users', // Tham chiếu đến Model User
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        router: {
            type: String,
            default: null
        },
        textRouter: {
            type: String,
            default: null
        },
    },
    {
    timestamps: true,
}
);
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;