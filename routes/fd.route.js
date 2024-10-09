import { Router } from 'express';
import { createFd, getFd, getFdInvestmentValue } from "../controllers/fd.controller.js";

const router = Router();

router.route("/create").post(createFd);
router.route("/list").post(getFd);
router.route("/get-total-investment-value").get(getFdInvestmentValue);

export default router;
