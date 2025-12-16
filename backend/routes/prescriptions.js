import express from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.post('/', authenticate, createPrescription);
router.put('/:id', authenticate, updatePrescription);
router.delete('/:id', authenticate, deletePrescription);

export default router;

