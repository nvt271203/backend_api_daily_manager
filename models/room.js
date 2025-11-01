const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    // Mảng chứa ID của tất cả các thành viên trong phòng chat
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Tham chiếu đến Model User
        required: true,
    }],
    // Có thể thêm các trường khác như: lastMessage, roomName, roomAvatar...
}, {
    // Tự động thêm trường createdAt và updatedAt
    timestamps: true,
});

const Room = mongoose.model('Rooms', roomSchema);
module.exports = Room;