const express = require('express');
const Department = require('../models/department');
const departmentRouter = express.Router();
departmentRouter.post('/api/admin/department', async (req, res)=>{
    try {
        const {name, address} = req.body;
        const department = new Department({name, address});
        await department.save();
        res.status(201).send(department);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});
departmentRouter.put('/api/admin/department/:id', async (req, res)=>{
    try {
        const {id} = req.params;
        const {name, address} = req.body;

        const department = await Department.findByIdAndUpdate(
            id,
            { name, address },
            { new: true, runValidators: true } // new:true trả về object sau khi update
        );
         if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }
        res.status(200).send(department);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});
departmentRouter.delete('/api/admin/department/:id', async (req, res) => {
  try { 
    const { id } = req.params;

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.status(200).json({ message: "Department deleted successfully", department });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// departmentRouter.get('/api/admin/department/:userId', async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const department = await Department.findById(userId);
//       if (!department) {
//         return res.status(404).json({ error: "Department not found" });
//       }
//       res.status(200).json(department);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
departmentRouter.get('/api/admin/department/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const department = await Department.findById(id);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.status(200).json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
departmentRouter.get('/api/admin/departments', async (req, res) => {
    try {
        const departments = await Department.find().sort({ _id: -1 }); // Sắp xếp theo ngày tạo mới nhất
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


departmentRouter.get('/api/admin/departments_pagination', async (req, res)=>{
 try {
    const page = parseInt(req.query.page) || 1;     // mặc định trang 1
    const limit = parseInt(req.query.limit) || 20;  // mặc định 20 bản ghi / trang
    const skip = (page - 1) * limit;

    // Lấy danh sách theo phân trang
    const departments = await Department.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // 👈 optional: sắp xếp mới nhất trước

    // Tổng số bản ghi để tính số trang
    const total = await Department.countDocuments();

    res.status(200).json({
      data: departments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }




})
module.exports = departmentRouter;