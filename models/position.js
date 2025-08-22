const mongoose = require('mongoose');
const positionSchema = mongoose.Schema(
    {
        departmentId:{
            type: String,  
            required: true,
            trim: true,
        },
        departmentName:{
            type: String,
            required: true,
            trim: true,
        },
        positionName:{
            type: String,
            required: true,
            trim: true,
        }
    });
const Position = mongoose.model('Positions', positionSchema);
module.exports = Position;