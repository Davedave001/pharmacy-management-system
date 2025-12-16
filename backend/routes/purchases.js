import express from 'express';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getPurchases);
router.get('/:id', authenticate, getPurchaseById);
router.post('/', authenticate, createPurchase);
router.put('/:id', authenticate, updatePurchase);
router.delete('/:id', authenticate, deletePurchase);

export default router;

