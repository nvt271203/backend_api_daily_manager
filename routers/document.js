const express = require('express');
const documentRouter = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Document = require('../models/document');

// ✅ Tạo storage chung
const storage = multer.memoryStorage();

// ✅ Tạo 2 Multer instances riêng biệt
const uploadSingle = multer({ storage: storage });
const uploadMultiple = multer({ storage: storage });


documentRouter.get('/api/documents_pagination', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    // 2. Lấy tổng số lượng document (để tính tổng số trang)
    // Bạn có thể thêm điều kiện filter vào countDocuments({}) nếu cần
    const totalDocuments = await Document.countDocuments({});
// 3. Tính tổng số trang
    const totalPages = Math.ceil(totalDocuments / limit);

// 4. Lấy document của trang hiện tại
    const documents = await Document.find({}) // Thêm filter vào {} nếu cần
      .skip(skip)    // Bỏ qua các document của trang trước
      .limit(limit)  // Giới hạn số lượ ng document lấy ra
      .sort({ uploadedAt: -1 }); // Sắp xếp (ví dụ: mới nhất trước)
      // 5. Trả về kết quả
    res.json({
      documents: documents,
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalDocuments,
    });
  } catch (e) {
    res.status(500).json({ message: "Lỗi server khi lấy dữ liệu", error: e.message });
}});

// ===== ROUTE 1: Upload 1 file =====
documentRouter.post('/api/upload', uploadSingle.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn một file PDF.' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'my_pdfs',
        public_id: `${Date.now()}-${req.file.originalname}`,
      },
      async (error, result) => {
        if (error) {
          console.error('Lỗi Cloudinary:', error);
          return res.status(500).json({ message: 'Upload lên Cloudinary thất bại' });
        }

        const newDocument = new Document({
          name: req.body.name || req.file.originalname,
          pdfUrl: result.secure_url,
          cloudinaryId: result.public_id,
        });

        await newDocument.save();

        res.status(201).json({
          message: 'Upload file thành công!',
          document: newDocument,
        });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error('Lỗi Server:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
});

// ===== ROUTE 2: Upload nhiều files =====
documentRouter.post('/api/upload-multiple', uploadMultiple.array('pdfFiles', 10), async (req, res) => {
  try {
    console.log('✅ Request received!');
    console.log('📦 Files count:', req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Không có file nào được upload.' });
    }

    console.log('📄 Files:', req.files.map(f => f.originalname));

    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: 'my_pdfs',
            public_id: `${Date.now()}-${file.originalname}`,
          },
          (error, result) => {
            if (error) {
              console.error('Lỗi Cloudinary:', error);
              return reject(error);
            }
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    };

    console.log('☁️  Uploading to Cloudinary...');
    const uploadResults = await Promise.all(
      req.files.map(uploadToCloudinary)
    );

    const documentsToSave = uploadResults.map((result, index) => ({
      name: req.files[index].originalname,
      pdfUrl: result.secure_url,
      cloudinaryId: result.public_id,
    }));

    const newDocuments = await Document.insertMany(documentsToSave);

    console.log('✅ Upload thành công!\n');

    res.status(201).json({
      message: `Upload thành công ${newDocuments.length} files!`,
      documents: newDocuments,
      urls: newDocuments.map(doc => doc.pdfUrl)
    });

  } catch (err) {
    console.error('❌ Lỗi Server:', err);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: err.message });
  }
});

// ===== ERROR HANDLER =====
documentRouter.use((error, req, res, next) => {
  console.error('❌ Router Error:', error.message);
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'Multer Error',
      message: error.message,
      field: error.field 
    });
  }
  res.status(500).json({ error: error.message });
});

module.exports = documentRouter;