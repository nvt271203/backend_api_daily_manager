// import http from 'http';
// import { Server } from 'socket.io';;
const Leave = require('./models/leave'); // Cập nhật đường dẫn nếu khác
const { ObjectId } = require('mongoose').Types;
const User = require('./models/user'); // Cập nhật đường dẫn nếu khác
const Document = require('./models/document'); // Cập nhật đường dẫn nếu khác
require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;

//Làm việc vs socket
const http = require('http');
const { Server } = require('socket.io'); // Thư viện để tạo máy chủ Socket.IO
const mongoose = require('mongoose'); // Thư viện để kết nối và tương tác với MongoDB
const userRouter = require('./routers/user'); // Router để xử lý các yêu cầu liên quan đến người dùng
const workRouter = require('./routers/work'); // Router để xử lý các yêu cầu liên quan đến công việc
const leaveRouter = require('./routers/leave'); // Router để xử lý các yêu cầu liên quan đến nghỉ phép    
const departmentRouter = require('./routers/department'); // Router để xử lý các yêu cầu liên quan đến phòng ban  
const positionRouter = require('./routers/position'); // Router để xử lý các yêu cầu liên quan đến vị trí công việc 
const messageRouter = require('./routers/message'); // Router để xử lý các yêu cầu liên quan đến vị trí công việc 
const roomRouter = require('./routers/room'); // Router để xử lý các yêu cầu liên quan đến phòng chat
const documentRouter = require('./routers/document'); // Router để xử lý các yêu cầu liên quan đến document
const PORT = 3000;
const app = express();

// Tạo một máy chủ HTTP và kết nối với Socket.IO
const server = http.createServer(app);
const io = new Server(server);
// const userSockets = new Map();

// Lưu socket cho broadcast sau
global._io = io;

  io.on('connection', (socket) => {
    console.log('🟢 Admin connected via socket:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔴 Admin disconnected:', socket.id);
    });
  });



// Thiết lập Socket.IO để lắng nghe các kết nối từ phía client
// Khi có một kết nối mới, nó sẽ được xử lý trong hàm callback này
// `socket` là một đối tượng đại diện cho kết nối của client
// `io` là đối tượng Socket.IO toàn cục, cho phép gửi và nhận sự kiện từ tất cả các kết nối 
//---- Tức là khi có một client kết nối đến server, hàm này sẽ được gọi và chúng ta có thể xử lý các sự kiện liên quan đến client đó
// io.on('connection', (socket) => {
//     console.log(`Connected:${socket.id} `);

//     // Lắng nghe sự kiện 'user-join' từ client
//     // Khi client gửi sự kiện này, chúng ta sẽ lưu trữ socket ID của người dùng trong Map `userSockets` với key là tên người dùng
//     // Sau đó, gửi lại thông báo cho client rằng phiên làm việc đã được bắt đầu
//     socket.on('user-join', (data) => {
//         userSockets.set(data,socket.id);
//         io.to(socket.id).emit('session-join', 'Your session has been started');
//     });
//     socket.on('disconnect', () => {
//         for(let [user, socketId] of userSockets.entries()) {
//             if (socketId == socket.id) {
//                 userSockets.delete(user);
//                 console.log(`User ${user} disconnected`);
//                 break;
//             }
//         }
//     });
// });



// Middleware để xử lý CORS (Cross-Origin Resource Sharing) cho phép các yêu cầu từ các nguồn khác nhau
// CORS là một cơ chế bảo mật trong trình duyệt web để ngăn chặn các yêu cầu từ các nguồn khác nhau (cross-origin requests) mà không được phép.
// Middleware này cho phép ứng dụng của bạn chấp nhận các yêu cầu từ các nguồn khác
const cors = require('cors');
app.use(cors());
app.use(documentRouter)

//---------------------------------------------
app.use(express.json()); // Middleware để phân tích dữ liệu JSON trong yêu cầu HTTP 


app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});
app.use(userRouter); // Sử dụng router người dùng để xử lý các yêu cầu liên quan đến người dùng
app.use(workRouter); // Sử dụng router công việc để xử lý các yêu cầu liên quan đến công việc
app.use(leaveRouter); // Sử dụng router nghỉ phép để xử lý các yêu cầu liên quan đến nghỉ phép
app.use(departmentRouter); // Sử dụng router phòng ban để xử lý các yêu cầu liên quan đến phòng ban
app.use(positionRouter); // Sử dụng router vị trí công việc để xử lý các yêu cầu liên quan đến vị trí công việc
app.use(messageRouter); // Sử dụng router message để xử lý các yêu cầu liên quan đến message
app.use(roomRouter); // Sử dụng router room để xử lý các yêu cầu liên quan đến room chat
// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI)
  .then(async() => {
    console.log('MongoDB connected');


    // const result = await mongoose.connection.db
    //   .collection("leaves")
    //   .deleteMany({ userId: "688001ce7e672d1e4b9353ac" });

    // console.log("🔥 Deleted leaves:", result.deletedCount);
    // process.exit();

//  const result = await mongoose.connection.db
//       .collection("users")
//       .updateMany({}, { $unset: { position: 1, department: 1 } });

//     console.log("🔥 Raw result:", result);
//     process.exit();

    // // 🧹 Xóa dữ liệu
    // try {
    //   const result = await Leave.deleteOne({ _id: new ObjectId("68800b447e672d1e4b93542a") });
    //   console.log('🗑️ Delete result:', result);
    // } catch (error) {
    //   console.error('❌ Delete error:', error);
    // }
  //   const result = await Leave.updateMany(
  //   { isNew: { $exists: true } },
  //   { $set: { isNew: false } }
  // );
  // Cập nhật tất cả user chưa có department thành chuỗi rỗng
  //  const result = await User.updateMany(
  //   { $or: [ { position: "" }, { department: "" } ] }, // lọc các user có "" ở 2 field này
  //   {
  //     $set: {
  //       position: null,
  //       department: null
  //     }
  //   }
  // );
  // Sử dụng toán tử $unset để xóa các trường 'position' và 'department'

// const result = await Leave.updateMany(
//   {}, // {} nghĩa là không filter, chọn tất cả document
//   { $set: { status: "Approved" } }
// );

// const result = await User.updateMany(
//   {}, // {} nghĩa là không filter, chọn tất cả document
//   { $set: { status: "true" } }
// );
const result = await Document.updateMany(
  {}, // {} nghĩa là không filter, chọn tất cả document
  { $set: { isTrain: "false" } }
);


// const users = await User.find().lean();

// const bulkOps = users.map(u => ({
//   updateOne: {
//     filter: { _id: u._id },
//     update: { $set: { createdAt: u._id.getTimestamp().toISOString() } }
//   }
// }));

// if (bulkOps.length > 0) {
//   const result = await User.bulkWrite(bulkOps);
//   console.log(`✅ Đã cập nhật ${result.modifiedCount} user`);
// } else {
//   console.log('Không có user nào cần cập nhật');
// }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
  // Lỗi nếu dùng cho socket. phải thay app bằng serve
// Start the server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on port ${PORT}`);
// });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server with Socket.IO is running-${PORT}`);

});

