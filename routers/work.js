const express = require('express'); // Framework để tạo các API HTTP.
const Work = require('../models/work'); // Đây là mô hình của một công việc, bao gồm các thông tin như thời gian check-in, check-out, thời gian làm việc, báo cáo, kế hoạch và ID người dùng.
const User = require('../models/user'); // Mô hình người dùng, để lấy thông tin người dùng liên quan đến công việc.
const workRouter = express.Router(); // Khởi tạo một router cho các API liên quan đến công việc.

workRouter.post('/api/work', async (req, res) => {
    try {
        const { checkInTime, checkOutTime, workTime, report, plan, note, userId } = req.body;
        // Tạo một công việc mới vớ i các thông tin từ yêu cầu
        const work = new Work({ checkInTime, checkOutTime, workTime, report, plan, note, userId });
        // Lưu công việc vào cơ sở dữ liệu
        await work.save();
         console.log('📣 Emitting work_checkIn event to socket');
     global._io.emit('work_checkIn', work); // emit tới tất cả client

        res.status(201).json(work); // Trả về công việc đã tạo với mã trạng thái 201 (Created)
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});
workRouter.get('/api/works', async (req, res) => {
    try {
        const works = await Work.find(); // Lấy tất cả công việc từ cơ sở dữ liệu
        if (!works || works.length == 0) {
            return res.status(404).json({ message: 'No works found' }); // Trả về lỗi nếu không tìm thấy công việc
        }
        res.json(works); // Trả về danh sách công việc
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }});
workRouter.get('/api/work/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        const works = await Work.find({userId, checkOutTime: { $ne: null }  //Chỉ lấy các công việc đã check-out  
        }); // Tìm công việc theo userId từ tham số URL
        if (!works || works.length == 0) {
            return res.status(404).json({ message: 'Work of user not found' }); // Trả về lỗi nếu không tìm thấy công việc
        }
        res.json(works); // Trả về công việc tìm thấy
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

workRouter.get('/api/works_user_pagination/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;      // Mặc định trang 1
        const limit = parseInt(req.query.limit) || 20;   // Mặc định mỗi trang 10 bản ghi

        const skip = (page - 1) * limit;

        const [works, totalCount] = await Promise.all([
            Work.find({ userId, checkOutTime: { $ne: null } })
                .sort({ checkOutTime: -1 })              // Ưu tiên sắp xếp mới nhất
                .skip(skip)
                .limit(limit),
            Work.countDocuments({ userId, checkOutTime: { $ne: null } })
        ]);

        if (works.length === 0) {
            return res.status(404).json({ message: 'No work records found.' });
        }

        res.json({
            data: works,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// workRouter.get('/api/work', async (req, res) => {
//     try {
//         const works = await Work.find(); // Lấy tất cả công việc từ cơ sở dữ liệu
//         res.json(works); // Trả về danh sách công việc
//     } catch (e) {
//         res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
//     }
// });

workRouter.get('/api/admin/work_hours', async (req, res) => {
  try {
    // Lấy tham số từ query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Xây dựng điều kiện truy vấn
    const query = {};

    // Lọc theo khoảng ngày nếu có
    if (startDate && endDate) {
      endDate.setHours(23, 59, 59, 999);
      query.checkInTime = { $gte: startDate, $lte: endDate };
    }

    // Sắp xếp theo checkInTime giảm dần
    const sort = { checkInTime: -1 };

    // Lấy danh sách công việc
    const workHours = await Work.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Lấy thông tin người dùng cho từng workHours
    const workHoursWithUser = await Promise.all(
      workHours.map(async (work) => {
        const user = await User.findById(work.userId).lean(); // Lấy thông tin người dùng
        return {
          ...work,
          user: user || null, // Thêm thông tin người dùng vào từng bản ghi
        };
      })
    );

    // Tính tổng số bản ghi để tính tổng số trang
    const totalItems = await Work.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    // Trả về kết quả
    res.json({
      data: workHoursWithUser,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



workRouter.get('/api/work_checkin/:userId', async (req, res) => {
    try {
        const { userId } = req.params; // Lấy ID công việc từ tham số URL

        // Lấy bản ghi mới nhất của user chưa check-out
        const latestWork = await Work.findOne({
        userId,
        workTime: null, // hoặc checkInTime == checkOutTime nếu bạn muốn thay đổi
        })
        .sort({ checkInTime: -1 })
        .exec();
        
        if (!latestWork) {
            return res.status(404).json({ message: 'Work_checkin not found' }); // Trả về lỗi nếu không tìm thấy công việc
        }
        return res.status(200).json(latestWork); // Trả về mã trạng thái // Trả về công việc đã cập nhật
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

// 
workRouter.post('/api/work_checkin', async (req, res) => {
  try {
    const { checkInTime, userId ,report ,plan, note} = req.body;

    // Kiểm tra đầu vào
    if (!checkInTime || !userId) {
      return res.status(400).json({ message: 'Missing checkInTime or userId' });
    }

    // Tạo mới bản ghi
    const newWork = new Work({
      checkInTime: new Date(checkInTime),
      userId,
      checkOutTime: null,
      workTime: null,
      report: report,
      plan: plan,
      note: note,
    });
    // Lưu vào database
    const savedWork = await newWork.save();
         // 👇 Emit event tới client
    
    return res.status(201).json(savedWork);
  } catch (e) {
    console.error('❌ Error creating work:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// // Cập nhập thêm dữ liệu work nếu chỉ report
// workRouter.put('/api/work/:id', async (req, res) => {
//     try {
//         const { id } = req.params; // Lấy ID công việc từ tham số URL
//         const { report, plan, note} = req.body; // Lấy các thông tin cập nhật từ yêu cầu
//         const updateWork = await Work.findByIdAndUpdate(
//             id, 
//             { report, plan, note }, // Cập nhật các trường cần thiết
//             { new: true } // Trả về tài liệu đã cập nhật
//         );

        
//         if (!updateWork) {
//             return res.status(404).json({ message: 'Work not found' }); // Trả về lỗi nếu không tìm thấy công việc
//         }
//         return res.status(200).json(updateWork); // Trả về mã trạng thái // Trả về công việc đã cập nhật
//     } catch (e) {
//         res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
//     }
// });
    


// CHECK-OUT : Cập nhập thêm dữ liệu work nếu chưa report
workRouter.put('/api/work/:id', async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID công việc từ tham số URL
        const {checkOutTime, workTime, report, plan, note} = req.body; // Lấy các thông tin cập nhật từ yêu cầu
        const updateWork = await Work.findByIdAndUpdate(
            id,
            { checkOutTime, workTime, report, plan, note }, // Cập nhật các trường cần thiết
            { new: true } // Trả về tài liệu đã cập nhật
        );

        
        if (!updateWork) {
            return res.status(404).json({ message: 'Work not found' }); // Trả về lỗi nếu không tìm thấy công việc
        }
        return res.status(200).json(updateWork); // Trả về mã trạng thái // Trả về công việc đã cập nhật
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});
    
// // Tạo endpoint để lấy bản ghi check-in đang hoạt động
// workRouter.get('/api/work/active/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Tìm bản ghi check-in đang hoạt động (chưa check-out)
//     const activeWork = await Work.findOne({
//       userId,
//       checkOutTime: null,
//     });

//     if (!activeWork) {
//       return res.status(404).json({ message: 'No active check-in found for this user' });
//     }

//     return res.status(200).json(activeWork); // Trả về bản ghi, bao gồm _id
//   } catch (e) {
//     console.error('❌ Error fetching active work:', e.message);
//     return res.status(500).json({ error: e.message });
//   }
// });


// Tạo endpoint để lấy bản ghi check-in đang hoạt động với thời gian check-in cụ thể
workRouter.get('/api/work/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm bản ghi check-in đang hoạt động (chưa check-out)
    const activeWork = await Work.findOne({
      userId,
      checkOutTime: null,
    });

    if (!activeWork) {
      return res.status(404).json({ message: 'No active check-in found for this user' });
    }

    return res.status(200).json(activeWork); // Trả về bản ghi, bao gồm _id
  } catch (e) {
    console.error('❌ Error fetching active work:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// Method để lấy ra dữ liệu người dùng đã checkin 1 thời gian cụ thể
workRouter.get('/api/work/active/:userId/:checkInTime', async (req, res) => {
  try {
    const { userId } = req.params;
    const { checkInTime } = req.params;
    // Tìm bản ghi check-in đang hoạt động (chưa check-out)
    const activeWork = await Work.findOne({
      userId,
      checkInTime,
      checkOutTime: null,
    });

    if (!activeWork) {
      return res.status(404).json({ message: 'No active check-in found for this user' });
    }

    return res.status(200).json(activeWork); // Trả về bản ghi, bao gồm _id
  } catch (e) {
    console.error('❌ Error fetching active work:', e.message);
    return res.status(500).json({ error: e.message });
  }
});





workRouter.put('/api/work/:id', async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID công việc từ tham số URL
        const {checkOutTime, workTime, report, plan, note} = req.body; // Lấy các thông tin cập nhật từ yêu cầu
        const updateWork = await Work.findByIdAndUpdate(
            id, 
            { checkOutTime, workTime, report, plan, note }, // Cập nhật các trường cần thiết
            { new: true } // Trả về tài liệu đã cập nhật
        );

        
        if (!updateWork) {
            return res.status(404).json({ message: 'Work not found' }); // Trả về lỗi nếu không tìm thấy công việc
        }
        return res.status(200).json(updateWork); // Trả về mã trạng thái // Trả về công việc đã cập nhật
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});
    
module.exports = workRouter; // Xuất router để sử dụng trong các tệp khác
// Đây là các API liên quan đến công việc, bao gồm tạo công việc mới và lấy