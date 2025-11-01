const mongoose = require('mongoose');
const userSchema = mongoose.Schema(
    {
    fullName:{
        type: String,
        trim: true,
    },
    birthDay:{
        type: String,
        trim: true,
    },
    sex:{
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    status: {
        type: Boolean,
        default: 'true',
    },
    email:{
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value)=>{
                const result = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                return result.test(value);
            },
            message: 'Vui lòng nhập đúng định dạng email !'
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                return value.length >=8;
            },
            message : "Mật khẩu yếu, vui lòng nhập mật khẩu dài hơn nhé ! "
        }
    },
    image:{
        type: String,
        default: "",
        trim: true,
    },
    phoneNumber:{
        type: String,
        default: "",
        trim: true,
    },
    // position:{
    //     type: String,
    //     default: null,
    //     trim: true,
    // },
    // department:{
    //     type: String,
    //     default: null,
    //     trim: true,
    // },
    departmentId:{
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    positionId:{
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    createdAt:{
        type: String,
        default: null,
        trim: true,
    },
    resetPasswordToken: {
  type: String,
},
resetPasswordExpires: {
  type: Date,
},
    // // thso ko bắt buộc
    // state:{
    //     type: String,
    //     default:"",
    //     trim: true,
    // },
    // locality:{
    //     type: String,
    //     default:"",
    //     trim: true,
    // },
    // city:{
    //     type: String,
    //     default:"",
    //     trim: true,
    // }
    }
);
const User = mongoose.model("Users", userSchema);
module.exports = User;
