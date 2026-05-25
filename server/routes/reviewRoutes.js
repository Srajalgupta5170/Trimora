import express from 'express';
import {
  submitReview,
  getBarberReviews,
  markHelpful,
  respondToReview,
  getPendingReviews,
  moderateReview
} from '../controllers/reviewController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Get reviews for a barber
router.get('/barber/:barberId/reviews', getBarberReviews);

// ===== CUSTOMER ROUTES =====
// Submit review
router.post('/barber/:barberId/reviews', protect, authorizeRoles('customer'), submitReview);

// Mark review as helpful
router.post('/reviews/:reviewId/helpful', protect, markHelpful);

// ===== BARBER ROUTES =====
// Get pending reviews for moderation
router.get('/me/reviews/pending', protect, authorizeRoles('barber'), getPendingReviews);

// Respond to review
router.post('/reviews/:reviewId/respond', protect, authorizeRoles('barber'), respondToReview);

// Moderate review (approve/reject)
router.put('/reviews/:reviewId/moderate', protect, authorizeRoles('barber'), moderateReview);

export default router;
