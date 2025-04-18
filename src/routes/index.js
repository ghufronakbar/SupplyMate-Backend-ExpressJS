import express from 'express';
const router = express.Router();
import account from '../services/account.js';
import user from '../services/user.js';
import products from '../services/product.js';
import image from '../services/image.js'
import order from '../services/order.js';
import partner from '../services/partner.js'
import dashboard from '../services/dashboard.js'
import input from '../services/input.js'
import report from '../services/report.js'

router.use('/dashboard', dashboard)
router.use('/account', account);
router.use('/users', user);
router.use('/products', products);
router.use('/inputs', input)
router.use('/orders', order)
router.use("/partners", partner)
router.use("/image", image)
router.use("/report", report)

export default router