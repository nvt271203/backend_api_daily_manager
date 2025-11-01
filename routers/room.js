const express = require('express');
const Room = require('../models/room');
const auth = require('../middlewares/auth');

const roomRouter = express.Router();

// API: Tìm một phòng chat 1-1 đã tồn tại hoặc tạo mới nếu chưa có
roomRouter.post('/api/rooms/find-or-create', auth, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ error: 'receiverId is required.' });
        }
        if (senderId === receiverId) {
             return res.status(400).json({ error: 'Cannot create a room with yourself.' });
        }

        // Tìm phòng chat 1-1 chỉ chứa 2 thành viên này
        let room = await Room.findOne({
            members: { $all: [senderId, receiverId], $size: 2 }
        });

        if (room) {
            // Nếu phòng đã có, trả về thông tin phòng
            return res.status(200).json(room);
        }

        // Nếu chưa có, tạo phòng mới
        const newRoom = new Room({
            members: [senderId, receiverId],
        });
        await newRoom.save();
        res.status(201).json(newRoom);

    } catch (e) {
         // THÊM DÒNG NÀY VÀO
        console.error("!!! ERROR in /api/rooms/find-or-create:", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = roomRouter;