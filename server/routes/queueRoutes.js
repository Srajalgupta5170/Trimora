import express from 'express';
import {
  joinQueue,
  leaveQueue,
  getBarberQueue,
  getBarberQueuePublic,
  getMyQueuePosition,
  getMyStatus,
  callNextCustomer,
  completeService,
  getQueueStats,
  cleanupCompletedEntries,
  cleanupStaleEntries
} from '../controllers/queueController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';
import { verifyBarberAccess } from '../middlewares/barberAuthMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Get barber's queue (public - for customers to see queue before joining)
router.get('/barber/:barberId/public', getBarberQueuePublic);

// ===== CUSTOMER ROUTES =====
// Customer joins queue
router.post('/join', protect, authorizeRoles('customer'), joinQueue);

// Customer leaves queue
router.post('/leave', protect, authorizeRoles('customer'), leaveQueue);

// Customer checks their position (across all barbers)
router.get('/my-position', protect, authorizeRoles('customer'), getMyQueuePosition);

// Customer checks status for specific barber
router.get('/my-status/:barberId', protect, authorizeRoles('customer'), getMyStatus);

// ===== BARBER ROUTES (Protected by verifyBarberAccess) =====
// Barber views their queue
router.get('/barber/:barberId', protect, authorizeRoles('barber'), verifyBarberAccess, getBarberQueue);

// Barber calls next customer
router.post('/barber/:barberId/next', protect, authorizeRoles('barber'), verifyBarberAccess, callNextCustomer);

// Barber completes service
router.post('/barber/:barberId/complete', protect, authorizeRoles('barber'), verifyBarberAccess, completeService);

// Barber views stats
router.get('/barber/:barberId/stats', protect, authorizeRoles('barber'), verifyBarberAccess, getQueueStats);

// ===== ADMIN/MAINTENANCE ROUTES =====
// Cleanup completed entries (should be called via scheduled job)
router.post('/admin/cleanup-completed', protect, authorizeRoles('admin'), cleanupCompletedEntries);

// Cleanup stale entries (should be called via scheduled job)
router.post('/admin/cleanup-stale', protect, authorizeRoles('admin'), cleanupStaleEntries);

export default router;