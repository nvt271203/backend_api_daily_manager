const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ error: 'No auth token, access denied' });
        }

        // !!! THAY 'your-jwt-secret-key' BẰNG MỘT CHUỖI BÍ MẬT CỦA BẠN
        const decoded = jwt.verify(token, 'xHajhJakVk6bA5XP');
        if (!decoded) {
            return res.status(401).json({ error: 'Token verification failed, authorization denied.' });
        }

        // Gán id và token vào request để các route sau có thể sử dụng
        req.user = { id: decoded.id };
        req.token = token;
        next(); // Chuyển sang xử lý tiếp theo

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = auth;