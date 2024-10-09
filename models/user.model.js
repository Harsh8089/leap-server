import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            trim: true,
            lowercase: true,
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        age: {
            type: Number
        },
        coins: {
            type: Number,
            default: 100000
        },
    },
    {
        collection: 'user',   
        timestamps: true
    }
);

// Create a model from the schema
const User = mongoose.model('User', userSchema);

export default User;
