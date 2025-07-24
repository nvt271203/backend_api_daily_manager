
const nodemailer = require('nodemailer');
const { PASSWORD_RESET_REQUEST_TEMPLATE } = require('../mailtrap/email_template');

// const sendPasswordResetEmail = async (email, resetURL) => {
//     try{
//         const transport = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: 'nvtai2712@gmail.com',
//                 pass: process.env.SMTP_PASSWORD // Lấy mật khẩu từ biến môi trường
//             }

//         });

//         const response = await transport.sendMail({
//             from: 'daily@gmail.com',
//             to: email,
//             subject: 'Password Reset Request',
//             html: PASSWORD_RESET_REQUEST_TEMPLATE(resetURL), // ✅ Gọi hàm
    
//     });
//     console.log("Password reset email sent successfully:", response);
//     }catch (error) {
//         console.error("Error sending password reset email:", error);
//         throw new Error("Failed to send password reset email");
//     }
// }

async function sendPasswordResetEmail(to, content) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nvtai2712@gmail.com',
      pass: process.env.SMTP_PASSWORD  // dùng App Password, không dùng mật khẩu gmail thường
    }
  });

  await transporter.sendMail({
    from: 'yourgmail@gmail.com',
    to,
    subject: 'Mã OTP Đặt Lại Mật Khẩu',
    text: content
  });
}
module.exports = sendPasswordResetEmail;