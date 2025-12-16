import express from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getSalesByDateRange,
} from '../controllers/saleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSales);
router.get('/date-range', authenticate, getSalesByDateRange);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSale);
router.put('/:id', authenticate, updateSale);
router.delete('/:id', authenticate, deleteSale);

export default router;

