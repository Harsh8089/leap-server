import Fd from '../models/fd.model.js';
import User from '../models/user.model.js';

const createFd = async (req, res) => {
    try {
        const { userId, amount, interest, duration } = req.body;
        const currdate = new Date();
        const creationDate = {
            day: currdate.getDate(),
            month: currdate.getMonth() + 1,
            year: currdate.getFullYear(),
        }
        currdate.setMonth(currdate.getMonth() + 1 + (duration.year * 12) + duration.month);
        const maturityDate = currdate.toDateString();
        const newFd = new Fd({
            userId,
            amount,
            interest,
            duration,
            maturityDate,
            creationDate,
            status: 'active'
        });
        const savedFd = await newFd.save();
        const user = await User.findById(userId);
        user.coins -= amount;
        await user.save();
        res.status(200).json({
            "message": "Successful"
        });
        return savedFd;
    } catch (error) {
        console.error('Error creating FD:', error);
        throw error;
    }
};

const getFd = async (req, res) => {
    try {
        const { userId } = req.body;
        const documents = await Fd.find({ userId: userId });
        res.status(200).json({
            "documents": documents
        });
    } catch (error) {
        console.error("Error Fetching");
    }
};

const getFdInvestmentValue = async (req, res) => {
    try {
        const { userId } = req.query;
        const documents = await Fd.find({ userId: userId });
        let totalInvestmentValue = 0;
        const currentDate = new Date();
        const currentDateMs = currentDate.getTime();
        documents.forEach((document) => {
            const creationDate = new Date(document["creationDate"]["year"], document["creationDate"]["month"] - 1, document["creationDate"]["day"]);
            const creationDateMs = creationDate.getTime();
            const differenceMs = Math.abs(currentDateMs - creationDateMs);
            const days = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
            totalInvestmentValue += document["amount"] * Math.pow((1 + (document["interest"] / 100) / 365), days);         
        });
        res.status(200).json(
            {
                totalInvestmentValue: totalInvestmentValue,
            }
        );
    } catch (error) {
        console.error("Some Error");
    }
};

export {
    createFd,
    getFd,
    getFdInvestmentValue,
};