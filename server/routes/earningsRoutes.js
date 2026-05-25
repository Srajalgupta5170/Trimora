import express from 'express';
import {
  getBarberEarnings,
  getSalonEarnings,
  getBarberEarningsBreakdown,
} from '../controllers/earningsController.js';
import { protect } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Barber routes
router.get('/barber/overview', protect, getBarberEarnings);
router.get('/barber/:barberId/breakdown', protect, getBarberEarningsBreakdown);

// Salon owner routes
router.get('/salon/overview', protect, getSalonEarnings);

export default router;
