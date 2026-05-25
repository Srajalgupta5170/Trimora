import express from 'express';
import {
  getBarberProfile,
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  createService,
  getMyServices,
  updateService,
  deleteService,
  uploadPortfolioImage,
  getPortfolio,
  getMyPortfolio,
  deletePortfolioImage,
  updatePortfolioOrder,
  getBarberReviews,
  getSalonMedia,
  getBarberStats,
  leaveSalon,
  removeBarber
} from '../controllers/barberProfileController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES =====
// Get barber profile (public view)
router.get('/profile/:barberId', getBarberProfile);

// Get barber portfolio
router.get('/portfolio/:barberId', getPortfolio);

// Get barber reviews
router.get('/reviews/:barberId', getBarberReviews);

// ===== BARBER PROTECTED ROUTES =====
// Get my profile
router.get('/me/profile', protect, authorizeRoles('barber'), getMyProfile);

// Update my profile
router.put('/me/profile', protect, authorizeRoles('barber'), updateProfile);

// Upload profile image
router.post('/me/profile/image', 
  protect, 
  authorizeRoles('barber'), 
  upload.single('image'),
  uploadProfileImage
);

// ===== SERVICES =====
// Create service
router.post('/me/services', protect, authorizeRoles('barber'), createService);

// Get my services
router.get('/me/services', protect, authorizeRoles('barber'), getMyServices);

// Update service
router.put('/me/services/:serviceId', protect, authorizeRoles('barber'), updateService);

// Delete service
router.delete('/me/services/:serviceId', protect, authorizeRoles('barber'), deleteService);

// ===== PORTFOLIO =====
// Upload portfolio image
router.post('/me/portfolio', 
  protect, 
  authorizeRoles('barber'), 
  upload.single('image'),
  uploadPortfolioImage
);

// Get my portfolio
router.get('/me/portfolio', protect, authorizeRoles('barber'), getMyPortfolio);

// Delete portfolio image
router.delete('/me/portfolio/:imageId', protect, authorizeRoles('barber'), deletePortfolioImage);

// Update portfolio order
router.put('/me/portfolio/order', protect, authorizeRoles('barber'), updatePortfolioOrder);

// ===== SALON MEDIA =====
// Get salon media
router.get('/me/salon-media', protect, authorizeRoles('barber'), getSalonMedia);

// ===== STATISTICS =====
// Get barber stats
router.get('/me/stats', protect, authorizeRoles('barber'), getBarberStats);

// ===== LEAVE/REMOVE SALON =====
// Barber leaves salon
router.post('/me/leave-salon', protect, authorizeRoles('barber'), leaveSalon);

// Owner removes barber from salon
router.delete('/:barberUserIdOrId/remove', protect, authorizeRoles('salonOwner'), removeBarber);

export default router;
