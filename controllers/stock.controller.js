import User from "../models/user.model.js";
import StockMap from "../models/stockMap.model.js";
import Transaction from "../models/transaction.model.js";

const updateUserStocks = async(userId, scripId, qty, sell, atPrice) => {
    try {
        let stockMap = await StockMap.findOne({user: userId});

        if (!stockMap) {
            if (sell) {
                return {
                    success: false,
                    message: `You don't hold any shares for ${scripId}`
                }
            } else {
                stockMap = new StockMap({ user: userId });
            }
        }

        const stockDetail = stockMap.stocks.get(scripId) || { qty: 0, investedAmount: 0.0, avgPrice: 0.0, transactionRecord: 1, offset: 0 };

        if(!sell) {
            stockDetail.qty += qty;
            let totalPrice = Number(qty) * Number(atPrice);
            stockDetail.investedAmount += totalPrice;
            stockDetail.avgPrice = Number(stockDetail.investedAmount) / Number(stockDetail.qty);
            stockMap.totalInvestedAmount += totalPrice; 
        }
        else {
            if(Number(stockDetail.qty) < -qty) {
                return {
                    success: false,
                    message: `Not enough shares to sell for ${scripId}`
                }
            }

            let totalQty = -qty;
            const transactions = await Transaction.find({ 
                transactionType: 'buy', 
                scripId: scripId 
            })
            .sort({ timestamp: 1 })
            .skip((stockDetail.transactionRecord - 1));            
            
            let initialAmount = stockDetail.investedAmount;
            let flag = false;
            for(const txn of transactions) {
                if(stockDetail.offset > 0) {
                    if(totalQty - (Number(txn.qty) - Number(stockDetail.offset)) < 0) {
                        stockDetail.investedAmount -= totalQty * Number(txn.atPrice);
                        stockDetail.offset += totalQty;
                        break;
                    }
                    else {
                        stockDetail.transactionRecord++;
                        // console.log("1. Before: ", stockDetail.investedAmount);
                        stockDetail.investedAmount -= (Number(txn.qty) - Number(stockDetail.offset)) * Number(txn.atPrice);
                        totalQty -= Number(txn.qty - Number(stockDetail.offset));
                        // console.log("1. After:", stockDetail.investedAmount, txn.qty, stockDetail.offset, txn.atPrice, stockDetail.transactionRecord);
                        stockDetail.offset = 0;
                    }
                    flag = true;
                }
                else {
                    if(totalQty - Number(txn.qty) < 0) {
                        // console.log("2. Before: ", stockDetail.investedAmount);
                        stockDetail.investedAmount -= totalQty * Number(txn.atPrice);
                        stockDetail.offset = totalQty;
                        // console.log("2. After:", stockDetail.investedAmount, stockDetail.avgPrice, txn.qty, stockDetail.offset, txn.atPrice, stockDetail.transactionRecord);
                        break;
                    }
                    else {
                        stockDetail.transactionRecord++;
                        stockDetail.investedAmount -= Number(txn.qty) * Number(txn.atPrice);
                        totalQty -= Number(txn.qty);
                    }
                    flag = false;
                }
                
                if(totalQty <= 0) break;
            }
            
            stockDetail.qty += qty;
            if(stockDetail.qty != 0) {
                stockDetail.avgPrice = stockDetail.investedAmount / Number(stockDetail.qty)
            }
            else stockDetail.avgPrice = 0.0;

            let finalAmount = stockDetail.investedAmount;
            stockMap.totalInvestedAmount -= (initialAmount - finalAmount);
        }

        console.log("Qty:", stockDetail.qty, "Total Invested: ", stockDetail.investedAmount,  "Avg price:", stockDetail.avgPrice, "Curr Txn Record: ", stockDetail.transactionRecord, "Offset: ",stockDetail.offset);

        const transaction = new Transaction({
            scripId,
            transactionType: sell ? 'sell' : 'buy',
            atPrice,
            qty: Math.abs(qty),
            timestamp: new Date()
        });
        await transaction.save();

        if(!stockMap.transactions.has(scripId)) {
            stockMap.transactions.set(scripId, []);
        }
        stockMap.transactions.get(scripId).push(transaction._id);

        stockMap.stocks.set(scripId, stockDetail);
        
        
        await stockMap.save();

        return stockMap;

    } catch (error) {
        console.error("Error updating stocks:", error);
        return {
            success: false,
            message: "Internal server error"
        };
    }
}

const buyStocks = async (req, res) => {
    try {
        let { userId, scripId, qty, purchasedAt } = req.body; 

        qty = Number(qty);
        purchasedAt = Number(purchasedAt);

        if (userId == null || scripId == null || isNaN(qty) || isNaN(purchasedAt)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        const totalCost = qty * purchasedAt;

        if (totalCost > user.coins) {
            return res.status(400).json({
                success: false,
                message: "You don't have sufficient balance",
                required: totalCost - user.coins
            });
        }

        user.coins -= totalCost;
        await user.save();
        
        const stockMap = await updateUserStocks(userId, scripId, qty, false, purchasedAt);
        if(stockMap.success == false) {
            return res.status(400).json({
                success: false,
                message: stockMap.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock purchased successfully",
            holdings: stockMap,
            updatedBalance: user.coins
        });

    } catch (error) {
        console.error("Error in buyStocks:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request"
        });
    }
};

const sellStocks = async (req, res) => {
    try {
        let { userId, scripId, qty, soldAt } = req.body; 

        qty = Number(qty);
        soldAt = Number(soldAt);

        if (!userId || !scripId || !qty || !soldAt) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        let qty_var = -qty; 
        
        const stockMap = await updateUserStocks(userId, scripId, qty_var, true, soldAt);

        if(stockMap.success == false) {
            return res.status(400).json({
                success: false,
                message: stockMap.message
            });
        }

        if(stockMap) { 
            user.coins += qty * soldAt;
            await user.save();
    
            res.status(200).json({
                success: true,
                message: "Stock sold successfully",
                holdings: stockMap,
                updatedBalance: user.coins
            });
        }

    } catch (error) {
        console.error("Error in sellStocks:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request"
        });
    }
}

const getHoldingDetails = async(req, res) => {
    try {
        const { userId } = req.query;
        
        if(!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const stockMap = await StockMap.findOne({ user: userId });  
    
        if(!stockMap) {
            return res.status(404).json({
                success: false,
                message: `User does not hold any shares`
            });
        }

        return res.status(200).json({
            success: true,
            holdings: stockMap.stocks
        });

    } catch (error) {
        console.error("Error in getStocksHolding:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request"
        });
    }
}

const getHoldingDetailsofScripId = async (req, res) => {
    try {
        const { userId, scripId } = req.query;

        if(!userId || !scripId) {
            return res.status(400).json({ message: 'userId and scripId are required' });
        }

        const stockMap = await StockMap.findOne({ user: userId });

        if(!stockMap) {
            return res.status(404).json({ message: 'No holdings found for this user' });
        }

        const transactionIds = stockMap.transactions.get(scripId) || [];
        const transactions = await Transaction.find({
            _id: { $in: transactionIds },
            scripId: scripId
        }).sort({ timestamp: -1 }); 

        if(transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this scripId' });
        }

        res.status(200).json({
            success: true,
            transactions
        });

    } catch (error) {
        console.error('Error in getHoldingDetailsofScripId:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getTotalInvestmentAmount = async(req, res) => {
    try {
        const { userId } = req.query;
        if(!userId) {
            return res.status(400).json({ message: 'userId are required' });
        }

        const stockMap = await StockMap.findOne({ user: userId });
        if(!stockMap) {
            return res.status(200).json(
                { 
                    investedAmount: 0,
                    message: 'No holdings found for this user'
                }
            );
        }

        return res.status(200).json({
            success: true,
            totalInvestedAmount: stockMap.totalInvestedAmount
        });


    } catch (error) {
        console.error('Error in getTotalInvestment:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// This controller is purely for dev and testing purpose.
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find the stockMap for the user
        const stockMap = await StockMap.findOne({ user: userId });
        if (stockMap) {
            // Get all transaction IDs from the stockMap
            const allTransactionIds = Array.from(stockMap.transactions.values()).flat();
            // console.log(allTransactionIds);
            // Delete all related transactions
            await Transaction.deleteMany({ _id: { $in: allTransactionIds } });

            // Delete the stockMap
            await StockMap.findByIdAndDelete(stockMap._id);
        }

        // await Transaction.deleteMany({});

        // Delete the user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User and all related records deleted successfully"
        });

    } catch (error) {
        console.error("Error in delete:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the user"
        });
    }
};


const getShareCount = async (req, res) => {
    try {
        const { userId, scripId } = req.query;

        if(!userId || !scripId) {
            return res.status(400).json({ message: 'userId and scripId are required' });
        }

        const stockMap = await StockMap.findOne({ user: userId });

        if(!stockMap) {
            return res.status(404).json({ message: 'No holdings found for this user' });
        }

        const {qty, investedAmount, avgPrice} = stockMap.stocks.get(scripId);
       

        res.status(200).json({
            success: true,
            shares: qty,
            investedAmount,
            avgPrice            
        });

    } catch (error) {
        console.error('Error in getHoldingDetailsofScripId:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getShareHoldingsofAllUsers = async (req, res) => {
    try {
        const stockMaps = await StockMap.find().populate('user', 'username'); 

        const investmentDetails = [];

        stockMaps.forEach(stockMap => {
            const userInvestment = {
                userId: stockMap.user._id, 
                username: stockMap.user.username, 
                investments: {},
                investedAmount: stockMap.totalInvestedAmount 
            };
            
            stockMap.stocks.forEach((stockDetail, scripId) => {
                userInvestment.investments[scripId] = {
                    qty: stockDetail.qty,
                    avgPrice: stockDetail.avgPrice,
                };
            });

            investmentDetails.push(userInvestment);
        });

        res.status(200).json({
            success: true,
            investmentDetails,
        });
    } catch (error) {
        console.error("Error fetching share holdings:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching share holdings.",
        });
    }
};


export {
    buyStocks,
    sellStocks,
    getHoldingDetails,
    getHoldingDetailsofScripId,
    getTotalInvestmentAmount,
    getShareCount,
    getShareHoldingsofAllUsers,
    deleteUser
}
