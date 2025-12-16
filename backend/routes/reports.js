import express from 'express';
import {
  getSalesReport,
  getInventoryReport,
  getExpiryReport,
  getDashboardStats,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/sales', authenticate, getSalesReport);
router.get('/inventory', authenticate, getInventoryReport);
router.get('/expiry', authenticate, getExpiryReport);
router.get('/dashboard', authenticate, getDashboardStats);

export default router;

