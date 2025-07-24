const express = require('express'); // Framework để tạo các API HTTP.
const User = require('../models/user');  //Đây là mô hình của một người dùng, bao gồm các thông tin như fullname, email, và password.
const bcrypt = require('bcryptjs'); // Chắc là Framework để băm chuỗi
const jwt = require('jsonwebtoken'); // Thư viện để tạo và xác thực JSON Web Tokens (JWT) cho việc xác thực người dùng.
const authRouter = express.Router();  //KHởi tọa 1 router.
const crypto = require('crypto');
const sendPasswordResetEmail = require('../controllers/authController'); // Giả sử bạn có một hàm để gửi email reset password
const path = require('path');

authRouter.post('/api/user/forgot_password', async (req, res) => {
    const { email } = req.body; // Lấy email từ body của yêu cầu
    try {
        const user = await User.findOne({ email }); // Tìm người dùng theo email
        if (!user) {
            return res.status(400).json({ message: 'User not found with this email' }); // Trả về lỗi nếu không tìm thấy người dùng
        }
        // Tạo token định danh người dùng
        // const resetToken = crypto.randomBytes(28).toString('hex'); //Cách 1:  Tạo token ngẫu nhiên
        // Cách 2: tạo token 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số ngẫu nhiên
        const otpExpiry = Date.now() + 5 * 60 * 1000; // OTP hết hạn sau 5 phút

        // const resetTokenExpiry = Date.now() + 3600000; // Token hết hạn sau 1 giờ

        // user.resetPasswordToken  = resetToken; // Lưu token vào người dùng 
        // user.resetPasswordExpires = resetTokenExpiry; // Lưu thời gian hết hạn token

        user.resetPasswordToken = otp;
        user.resetPasswordExpires = otpExpiry;
        await user.save(); // Lưu người dùng với token mới

        //send email với token reset password
        // Đây là nơi bạn sẽ gửi email với token reset password đến người dùng.
        // await sendPasswordResetEmail(user.email, `http://localhost:3000/api/auth/reset-password/${resetToken}`); // Giả sử bạn có một hàm sendResetPasswordEmail để gửi email
        await sendPasswordResetEmail(user.email, `http://192.168.1.153:3000/api/auth/reset-password/${resetToken}`); // Giả sử bạn có một hàm sendResetPasswordEmail để gửi email

        return res.status(200).json({ message: 'Reset password email sent successfully' }); // Trả về thông báo thành công  



    } catch (e) {
        console.log('Error in gorgot password',e); // Ghi lỗi vào console để kiểm tra
        res.status(400).json({ message: 'Email không hợp lệ hoặc không tồn tại' }); // Trả về lỗi nếu email không hợp lệ hoặc không tồn tại     
        return res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
        
    }


});

authRouter.get('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send('Token không hợp lệ hoặc đã hết hạn');
    }

    // ✅ Trả về file HTML hoặc chuyển hướng về giao diện nhập mật khẩu mới
    // res.sendFile(path.join(__dirname, 'path/to/reset-password-form.html'));
    // ✅ Trả về file HTML reset mật khẩu
    const filePath = path.join(__dirname, '../views/reset-password-form.html');
        res.sendFile(filePath);
    // Hoặc nếu đang dùng frontend (React, Flutter web, ...):
    // res.redirect(`http://your-frontend-url.com/reset-password/${token}`);
  } catch (err) {
      console.error('🔥 Lỗi ở /api/auth/reset-password/:token:', err);
  res.status(500).send('Lỗi server');
  }
});


authRouter.post('/api/user/reset_password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send('Token không hợp lệ hoặc đã hết hạn');
    }


        // ✅ Mã hóa mật khẩu mới trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    // ✅ Gán mật khẩu mới
    // user.password = newPassword;// gán vầy là gán mật khẩu thô, sẽ bị lỗi, phải gán mật khẩu đã mã hóa băm mới đúng.
    user.password = hashedPassword; // Gán mật khẩu đã mã hóa
    // ✅ Xóa token sau khi dùng
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.send('Thay đổi mật khẩu thành công');
  } catch (err) {
    console.error('Lỗi khi thay đổi mật khẩu:', err);
    res.status(500).send('Lỗi server khi đổi mật khẩu');
  }
});









authRouter.post('/api/user/request-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 phút

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    await sendPasswordResetEmail(email, `Mã OTP đặt lại mật khẩu của bạn là: ${otp}. Có hiệu lực trong 5 phút.`);

    res.json({ message: 'OTP đã được gửi tới email' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.post('/api/user/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });

    res.json({ message: 'OTP hợp lệ, cho phép đặt lại mật khẩu' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.post('/api/user/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




















authRouter.post('/api/register', async (req, res) => {
    try {
        const { fullName, birthDay, sex, email, password } = req.body;
        // Kiểm tra xem người dùng đã tồn tại chưa     
        const existingUser = await User.findOne({ email: email });  
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
         }else{
            
            // Chắc là tạo định dạng Băm chuỗi
            const salt = await bcrypt.genSalt(10);

            // Áp dụng băm chuỗi vào mật khẩu
            const hashedPassword = await bcrypt.hash(password, salt);
        
 
            var user = new User({fullName, birthDay, sex, email, password: hashedPassword}); //3Thso này lấy từ ID
            user = await user.save();
            res.json({user});   
        }

    } catch (e) {
        res.status(500).json({error: e.message});
    }
});


authRouter.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Tìm người dùng theo email
        const findUser = await User.findOne({email });
        if (!findUser) {
            return res.status(400).json({ message: 'User not found with this email' });
        }else{
            const isMatch = await bcrypt.compare(password, findUser.password); // so sánh mật khẩu chưa mã hoá với mật khẩu đã mã hóa trong cơ sở dữ liệu
            if (!isMatch) {
                return res.status(400).json({ message: 'Password is incorrect, please re-enter password' });
            }else{
                // Tạo token định danh người dùng đã đăng nhập thành công
                const token = jwt.sign({id: findUser._id}, "passwordKey");
                const { password, ...userWithoutPassword } = findUser._doc; // loại bỏ mật khẩu khỏi đối tượng người dùng
                     //Lưu 2 key là token và đối tượng User
                res.json({token, user: userWithoutPassword});
            }
        }
}
    catch (e) {
        res.status(500).json({error: e.message});
    }
});


authRouter.get('/api/users', async (req, res) => {
    try {
       const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );        const users = await User.find(); // Lấy tất cả công việc từ cơ sở dữ liệu
        res.json(users); // Trả về danh sách user
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }
});

authRouter.get('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id); // ✅ Sửa chỗ này

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user); // Trả về user tìm thấy
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});




authRouter.put('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID người dùng từ tham số URL
        const { fullName, birthDay, sex, image, phoneNumber } = req.body; // Lấy thông tin người dùng từ body của yêu cầu
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { fullName, birthDay,sex, image, phoneNumber},
            { new: true } // Trả về người dùng đã cập nhật
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' }); // Trả về lỗi nếu không tìm thấy người dùng
        } 
    // 👇 Emit event tới client
    console.log('📣 Emitting user_updated event to socket');
     global._io.emit('user_updated', updatedUser); // emit tới tất cả client

        return res.status(200).json(updatedUser); // Trả về người dùng đã cập nhật
    } catch (e) {
        res.status(500).json({ error: e.message }); // Trả về lỗi nếu có vấn đề xảy ra
    }   
});



module.exports = authRouter;