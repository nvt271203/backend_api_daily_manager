const express = require('express'); // Framework để tạo các API HTTP.
const Message = require('../models/message'); // Mô hình dữ liệu cho đơn xin nghỉ phép.
const messageRouter = express.Router(); // Khởi tạo một router cho các API liên quan đến nghỉ phép.
const auth = require('../middlewares/auth');
const Room = require('../models/room');
// API để gửi một tin nhắn mới
messageRouter.post('/api/messages', auth, async (req, res) => {
    try {
        // Lấy senderId từ token đã xác thực để đảm bảo an toàn
        const senderId = req.user.id;
        const { roomId, text, router, textRouter } = req.body;

        if (!roomId || !text) {
            return res.status(400).json({ error: 'roomId and text are required.' });
        }
        
        // Kiểm tra xem người gửi có phải là thành viên của phòng không
        const room = await Room.findById(roomId);
        if (!room || !room.members.includes(senderId)) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this room.' });
        }

        const message = new Message({
            roomId,
            senderId, // Sử dụng senderId đã xác thực
            text,
            // date sẽ được tự động thêm bởi timestamps: true
            router,
            textRouter
        });

        await message.save();
        res.status(201).json(message);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// =============================================================
// API MỚI: LẤY TẤT CẢ TIN NHẮN CỦA MỘT PHÒNG CHAT
// =============================================================
messageRouter.get('/api/messages/:roomId', auth, async (req, res) => {
    try {
        // Lấy roomId từ tham số trên URL (ví dụ: /api/messages/68f4abc...)
        const { roomId } = req.params;
        const userId = req.user.id;

         const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;


        // 1. (Bảo mật) Kiểm tra xem người yêu cầu có phải là thành viên của phòng không
        const room = await Room.findOne({ _id: roomId, members: userId });
        if (!room) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this room.' });
        }

        // 2. Tìm tất cả các tin nhắn có roomId tương ứng
        const messages = await Message.find({ roomId: roomId })
            .populate('senderId', '-password') // Làm đầy thông tin người gửi, trừ mật khẩu
            .sort({ createdAt: 'desc' }) // Sắp xếp theo thời gian tạo, tin mới nhất ở đầu (quan trọng cho chat)
            // Bỏ qua các tin nhắn của những trang trước
            .skip(skip)
            // Giới hạn số lượng tin nhắn lấy về cho trang hiện tại
            .limit(limit);

        // // 3. Trả về danh sách tin nhắn dưới dạng JSON
        // res.status(200).json(messages);
        // 3. (Cải tiến) Để tiện cho front-end, ta nên trả về cả thông tin phân trang
        const totalMessages = await Message.countDocuments({ roomId: roomId });
        const totalPages = Math.ceil(totalMessages / limit);

        // 4. Trả về danh sách tin nhắn và thông tin phân trang
        res.status(200).json({
            messages: messages.reverse(), // Đảo ngược lại để hiển thị đúng thứ tự trên UI (cũ -> mới)

            // messages: messages.reverse(), // Đảo ngược lại để hiển thị đúng thứ tự trên UI (cũ -> mới)
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalMessages: totalMessages
            }
        });
    } catch (e) {
    console.error(`!!! ERROR in GET /api/messages/${req.params.roomId}:`, e);
        res.status(500).json({ error: e.message });
    }
});
// Cấu trúc tương tự như route GET /api/messages/:roomId của bạn
messageRouter.post('/api/chatbot/ask', auth, async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ body và token đã xác thực
        const { roomId, text, router,textRouter } = req.body;
        const userId = req.user.id; // ID của người dùng đang gửi tin nhắn

        // (Bảo mật - Tùy chọn nhưng khuyến nghị) Kiểm tra xem người dùng có phải thành viên phòng chat không
        const room = await Room.findOne({ _id: roomId, members: userId });
        if (!room) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this room.' });
        }

        const chatbotId = process.env.CHATBOT_USER_ID; // Lấy ID của chatbot từ file .env

        const botMessage = new Message({
            roomId: roomId,
            text: text,
            senderId: chatbotId,
            router: router,
            textRouter: textRouter
        });
        await botMessage.save();

        // 4. "Làm đầy" thông tin người gửi (là chatbot) và trả về cho client
        // Client sẽ nhận được tin nhắn này và hiển thị nó ngay lập tức.
        const populatedBotMessage = await Message.findById(botMessage._id)
            .populate('senderId', '-password'); // Làm đầy thông tin người gửi, trừ mật khẩu

        res.status(201).json(populatedBotMessage); // Dùng 201 (Created) cho POST thành công

    } catch (e) {
        // Bắt lỗi và log ra console theo format của bạn
        console.error(`!!! ERROR in POST /api/chatbot/ask:`, e);
        res.status(500).json({ error: e.message });
    }
});


module.exports = messageRouter; 