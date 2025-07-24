const mongoose = require('mongoose');
const leaveSchema = mongoose.Schema(
    {
        dateCreated: {
            type: Date,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        leaveType: {
            type: String,
            enum: [ 'Sick', 'Personal', 'Other'],
            required: true,
        },
        leaveTimeType: {
            type: String,
            enum: ['Full Time', 'Part Time'],
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        userId: {
            type: String,
            required: true,
        },
    }
);
const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;