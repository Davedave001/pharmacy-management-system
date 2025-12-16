import express from 'express';
import {
  getNotifications,
  markAsRead,
  createNotification,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.post('/', authenticate, createNotification);

export default router;

