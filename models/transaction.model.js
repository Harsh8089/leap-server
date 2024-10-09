import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        scripId: {
            type: String,
            required: true
        },
        transactionType: {
            type: String,
            enum: ['buy', 'sell'],
            required: true
        },
        atPrice: {
            type: Number,
            required: true
        },
        qty: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
