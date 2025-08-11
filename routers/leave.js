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

// leaveRouter.get('/api/leaves_user_pagination/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const leaves = await Leave.find({ userId })
//             .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
//             .skip(skip)
//             .limit(limit);

//         const total = await Leave.countDocuments({ userId });

//         res.json({
//             data: leaves,
//             currentPage: page,
//             totalPages: Math.ceil(total / limit),
//             totalItems: total,
//         });
//     } catch (e) {
//         res.status(500).json({ error: e.message });
//     }
// });



// leaveRouter.get('/api/leaves_user_pagination/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 8;
//     const skip = (page - 1) * limit;

//     const leaves = await Leave.find({ userId })
//       .sort({startDate: -1, dateCreated: -1 }) // Sắp xếp mới nhất trước
//       //  .sort({ dateCreated: -1 }) // Sắp xếp mới nhất trước
//       .skip(skip)
//       .limit(limit)
//       .lean(); // Sử dụng lean để tối ưu

//     console.log('Backend leaves order:', leaves.map(leave => leave.startDate));

//  // Tính tổng số leaves theo tháng-năm cho toàn bộ user -- sai
// //  / Tính tổng số leaves theo tháng-năm cho toàn bộ user dựa trên startDate
//     const leavesByMonthYear = await Leave.aggregate([
//       { $match: { userId } },
//       {
//         $group: {
//           _id: {
//             // year: { $year: '$dateCreated' },
//             // month: { $month: '$dateCreated' },
//             year: { $year: { date: '$startDate', timezone: 'Asia/Ho_Chi_Minh' } },
//             month: { $month: { date: '$startDate', timezone: 'Asia/Ho_Chi_Minh' } },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           monthYear: {
//             $concat: [
//               {
//                 $cond: [
//                   { $lt: ['$_id.month', 10] },
//                   { $concat: ['0', { $toString: '$_id.month' }] },
//                   { $toString: '$_id.month' },
//                 ],
//               },
//               '/',
//               { $toString: '$_id.year' },
//             ],
//           },
//           count: 1,
//         },
//       },
//       {
//         $sort: { 'monthYear': -1 } // Sắp xếp tháng-năm từ mới nhất đến cũ nhất
//       }
//     ]);


//     res.json({
//       data: leaves,
//       currentPage: page,
//       totalPages: Math.ceil(await Leave.countDocuments({ userId }) / limit),
//       totalItems: await Leave.countDocuments({ userId }),
//       leavesByMonthYear,
//     });

//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });


leaveRouter.get('/api/leaves_user_pagination/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;
    const filterYear = req.query.filterYear ? parseInt(req.query.filterYear) : new Date().getFullYear();
    const sortField = req.query.sortField || 'startDate'; // Mặc định là startDate
    const sortOrder = req.query.sortOrder || 'desc'; // Mặc định giảm dần
    const status = req.query.status || 'all'; // Mặc định tất cả trạng thái

    // Xây dựng điều kiện lọc
    const query = { userId };

    // Lọc theo năm dựa trên startDate
    // if (filterYear) {
    //   query.startDate = {
    //     $gte: new Date(filterYear, 0, 1),
    //     $lte: new Date(filterYear, 11, 31, 23, 59, 59, 999),
    //   };
    // }
// Lọc theo năm dựa trên trường sắp xếp (sortField)
    if (filterYear) {
      query[sortField] = {
        $gte: new Date(filterYear, 0, 1),
        $lte: new Date(filterYear, 11, 31, 23, 59, 59, 999),
      };
    }
    // Lọc theo trạng thái
    if (status !== 'all') {
      query.status = status; // Chỉ thêm điều kiện nếu status không phải 'all'
    }

    // Xây dựng object sắp xếp
    // const sort = {};
    // sort[sortField] = sortOrder === 'asc' ? 1 : -1;
const sort = {
  [sortField]: sortOrder === 'asc' ? 1 : -1,
  _id: sortOrder === 'asc' ? 1 : -1, // Secondary sort để ổn định thứ tự
};

    // Lấy danh sách leaves
    const leaves = await Leave.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('Backend leaves order:', leaves.map(leave => ({ dateCreated: leave.dateCreated, startDate: leave.startDate })));

    // Tính tổng số leaves theo tháng-năm dựa trên startDate
    const leavesByMonthYear = await Leave.aggregate([
      { $match: query }, // Sử dụng query đã xây dựng để lọc
      {
        $group: {
          // _id: {
          //   year: { $year: { date: '$startDate', timezone: 'Asia/Ho_Chi_Minh' } },
          //   month: { $month: { date: '$startDate', timezone: 'Asia/Ho_Chi_Minh' } },
          // },
           _id: {
        year: { $year: { date: '$' + sortField, timezone: 'Asia/Ho_Chi_Minh' } },
        month: { $month: { date: '$' + sortField, timezone: 'Asia/Ho_Chi_Minh' } },
      },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          monthYear: {
            $concat: [
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
              '/',
              { $toString: '$_id.year' },
            ],
          },
          count: 1,
        },
      },
      {
        $sort: { 'monthYear': -1 } // Sắp xếp tháng-năm từ mới nhất đến cũ nhất
      },
    ]);

    // Trả về kết quả
    res.json({
      data: leaves,
      currentPage: page,
      totalPages: Math.ceil(await Leave.countDocuments(query) / limit),
      totalItems: await Leave.countDocuments(query),
      leavesByMonthYear,
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}); 



leaveRouter.put('/api/leave_remove_isnew/:id', async (req, res) => {
    try {
const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { isNew: false },
      { new: true } // Trả về tài liệu đã cập nhật
)
   res.json(leave); // Trả về đơn xin nghỉ phép đã cập nhật
    }catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

leaveRouter.put('/api/leave/:leaveId', async (req, res) => {
    try {
      const { leaveId } = req.params;
      const { status } = req.body;
    // Tìm và cập nhật trạng thái
      const updatedLeave = await Leave.findByIdAndUpdate(
        leaveId,
        { status },
        { new: true }
      );
   // Nếu không tìm thấy đơn
    if (!updatedLeave) {
      return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép' });
    }

    res.json({
      message: `Cập nhật trạng thái thành công`,
      leave: updatedLeave,
    });
     // 👇 Emit event tới client
        console.log('📣 Emitting leave_updated event to socket');
        global._io.emit('leave_updated', updatedLeave); // emit tới tất cả client


    }catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }});


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