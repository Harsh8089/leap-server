import { Router } from "express"
import {
    buyStocks,
    sellStocks,
    getHoldingDetails,
    deleteUser,
    getHoldingDetailsofScripId,
    getShareCount,
    getShareHoldingsofAllUsers,
    getTotalInvestmentAmount
} from '../controllers/stock.controller.js'

const router = Router()

router.route('/buy').post(buyStocks)
router.route('/sell').post(sellStocks)
router.route('/holdings').get(getHoldingDetails)
router.route('/get-holdings-of-scripid').get(getHoldingDetailsofScripId);
router.route('/get-total-invested-amount').get(getTotalInvestmentAmount);
router.route('/get-share-count').get(getShareCount);
router.route('/get-share-holdings-of-users').get(getShareHoldingsofAllUsers);
router.route('/delete').post(deleteUser);

export default router