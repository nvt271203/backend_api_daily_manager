const mongoose = require('mongoose');
const workSchema = mongoose.Schema(
    {
        checkInTime: {
            type: Date,
            required: true,
        },
        checkOutTime: {
            type: Date,
            // required: true,
        },
        workTime: {
            type: Number,
            // required: true,
        },
        report: {
            type: String,
            // required: true,
            trim: true,
        },
        plan: {
            type: String,
            // required: true,
            trim: true,
        },
        note: {
            type: String,
            // required: true,
            trim: true,
        },
        userId: {
            type: String,
            required: true,
        },
    }
);
const Work = mongoose.model('Work', workSchema);
module.exports = Work;