import express from 'express';
import {
  requestJoinSalon,
  getPendingRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  getMyRequests,
  cancelJoinRequest
} from '../controllers/joinRequestController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Barber routes
router.post(
  '/request',
  protect,
  authorizeRoles('barber'),
  requestJoinSalon
);

router.get(
  '/my-requests',
  protect,
  authorizeRoles('barber'),
  getMyRequests
);

router.delete(
  '/:requestId/cancel',
  protect,
  authorizeRoles('barber'),
  cancelJoinRequest
);

// Salon owner routes
router.get(
  '/pending',
  protect,
  authorizeRoles('salonOwner'),
  getPendingRequests
);

router.post(
  '/:requestId/accept',
  protect,
  authorizeRoles('salonOwner'),
  acceptJoinRequest
);

// Backward-compatible alias for older frontend bundles
router.post(
  '/:requestId/approve',
  protect,
  authorizeRoles('salonOwner'),
  acceptJoinRequest
);

router.post(
  '/:requestId/reject',
  protect,
  authorizeRoles('salonOwner'),
  rejectJoinRequest
);

export default router;
