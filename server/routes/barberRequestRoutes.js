import express from 'express';
import {
  requestToJoinSalon,
  getPendingRequests,
  approveBarberRequest,
  rejectBarberRequest,
  getBarberRequests,
  getAllSalonRequests,
} from '../controllers/barberRequestController.js';
import { protect } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Barber routes
router.post('/request-salon', protect, requestToJoinSalon);
router.get('/my-requests', protect, getBarberRequests);

// Owner routes
router.get('/pending', protect, getPendingRequests);
router.get('/all-requests', protect, getAllSalonRequests);
router.post('/:requestId/approve', protect, approveBarberRequest);
router.post('/:requestId/reject', protect, rejectBarberRequest);

export default router;
