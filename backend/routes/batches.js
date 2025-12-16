import express from 'express';
import {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getExpiringBatches,
} from '../controllers/batchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getBatches);
router.get('/expiring', authenticate, getExpiringBatches);
router.get('/:id', authenticate, getBatchById);
router.post('/', authenticate, createBatch);
router.put('/:id', authenticate, updateBatch);
router.delete('/:id', authenticate, deleteBatch);

export default router;

