const express = require('express'); // Framework để tạo các API HTTP.
const Leave = require('../models/leave'); // Đây là mô hình của một đơn xin nghỉ phép, bao gồm các thông tin như ngày bắt đầu, ngày kết thúc, loại thời gian nghỉ, lý do, trạng thái và ID người dùng.
const leaveRouter = express.Router(); // Khởi tạo một router cho các API liên quan đến nghỉ phép.

leaveRouter.post('/api/leave', async (req, res) => {
    try {
        const {dateCreated, startDate, endDate, leaveType, leaveTimeType, reason, userId } = req.body;
        // Tạo một đơn xin nghỉ phép mới với các thông tin từ yêu cầu
        const leave = new Leave({dateCreated, startDate, endDate, leaveType, leaveTimeType, reason, userId });
        // Lưu đơn xin nghỉ phép vào cơ sở dữ liệu
        await leave.save();
        res.status(201).json(leave); // Trả về đơn xin nghỉ phép đã tạo với mã trạng thái 201 (Created)
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

leaveRouter.get('/api/leave/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const leaves = await Leave.find({ userId }); // Tìm đơn xin nghỉ phép theo userId từ tham số URL
        if (!leaves || leaves.length == 0) {
            return res.status(404).json({ message: 'Leave of user not found' }); // Trả về lỗi nếu không tìm thấy đơn xin nghỉ phép
        }
        res.json(leaves); // Trả về đơn xin nghỉ phép tìm thấy
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
}); 


leaveRouter.delete('/api/leave/:id', async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID đơn phép từ tham số URL
        const deletedLeave = await Leave.findByIdAndDelete(id); // Xóa đơn phép theo ID

        if (!deletedLeave) {
            return res.status(404).json({ message: 'Leave not found' }); // Trả về lỗi nếu không tìm thấy đơn phép
        }
        res.status(200).json({ message: 'Leave deleted successfully' }); // Trả về thông báo thành công
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

leaveRouter.put('/api/leave/:id', async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID đơn phép từ tham số URL
        const {dateCreated, startDate, endDate, leaveType, leaveTimeType, reason, userId  } = req.body; // Lấy các thông tin cập nhật từ yêu cầu

        // Cập nhật đơn phép theo ID
        const updatedLeave = await Leave.findByIdAndUpdate(id, {
           dateCreated,
            startDate,
            endDate,
            leaveType,
            leaveTimeType,
            reason,
            userId
        }, { new: true });

        if (!updatedLeave) {
            return res.status(404).json({ message: 'Leave not found' }); // Trả về lỗi nếu không tìm thấy đơn phép
        }
        res.status(200).json(updatedLeave); // Trả về đơn phép đã cập nhật
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

leaveRouter.get('/api/leave', async (req, res) => {
    try {
        const leaves = await Leave.find(); // Lấy tất cả đơn xin nghỉ phép từ cơ sở dữ liệu
        res.json(leaves); // Trả về danh sách đơn xin nghỉ phép
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
}); 
module.exports = leaveRouter; // Xuất router để sử dụng trong các tệp khác
// Đây là các API liên quan đến nghỉ phép, bao gồm tạo đơn xin nghỉ phép mới