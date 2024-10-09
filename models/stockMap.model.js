import mongoose from "mongoose";

const stockDetailSchema = new mongoose.Schema({
    qty: {
        type: Number,
        required: true
    },
    investedAmount: {
        type: Number,
        required: true
    },
    avgPrice: {
        type: Number,
        required: true
    },
    transactionRecord: {
        type: Number,
        required: true
    },
    offset: {
        type: Number,
        required: true
    }
});

const stockMapSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Create map {scripId -> {qty, avgPrice}}
        stocks: {
            type: Map,
            of: stockDetailSchema,
            default: {}
        },
        // Create a map of scripId -> [Transactions]
        transactions: {
            type: Map,
            of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
            default: {}
        },
        totalInvestedAmount: {
            type: Number,
            required: true,
            default: 0.0
        }
    },
    {
        timestamps: true
    }
);

const StockMap = mongoose.model('StockMap', stockMapSchema);
export default StockMap;
