import { Router } from "express"
import {
    login,
    signUp
} from '../controllers/user.controller.js'

const router = Router()

router.route('/').get((req, res) => {
    res.send("Rick Rolled");
})
router.route('/login').post(login)
router.route('/register').post(signUp)

export default router