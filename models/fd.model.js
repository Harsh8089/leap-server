import mongoose from 'mongoose';

const fdSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, "User Id Required"],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
            set: v => parseFloat(v),
        },
        interest: {
            type: Number,
            required: [true, 'Interest rate is required'],
            min: [0, 'Interest rate cannot be negative'],
            max: [100, 'Interest rate cannot exceed 100%'],
            set: v => parseFloat(v),
        },
        duration: {
            year: {
                type: Number,
                required: true,
                min: 1,
            },
            month: {
                type: Number,
                required: true,
                min: 1,
                max: 12,
            },
        },
        status: {
            type: String,
            enum: ['active', 'matured', 'closed'],
            default: 'active'
        },
        maturityDate: {
            type: String,
            required: true,
        },
        creationDate: {
            day: {
                type: Number
            },
            month: {
                type: Number
            },
            year: {
                type: Number
            }
        }
    },
    {
        collection: 'fd',   
        timestamps: true
    }
);

const Fd = mongoose.model('fd', fdSchema);

export default Fd;