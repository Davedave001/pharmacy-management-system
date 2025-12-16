import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
} from '../controllers/medicineController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getMedicines);
router.get('/low-stock', authenticate, getLowStockMedicines);
router.get('/:id', authenticate, getMedicineById);
router.post('/', authenticate, createMedicine);
router.put('/:id', authenticate, updateMedicine);
router.delete('/:id', authenticate, deleteMedicine);

export default router;

