import express from 'express';
import { signup, login, registerSalonOwner, addBarberToSalon, getBarbers, getAvailableSalons, joinSalon } from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';
import { verifySalonOwnerAccess } from '../middlewares/salonOwnerAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/register-salon', registerSalonOwner);

// NEW: Public route for barbers to browse available salons
router.get('/available-salons', getAvailableSalons);

// Protected routes
router.get('/barbers', protect, getBarbers);

// NEW: Protected route for barbers to join a salon
router.post('/join-salon', protect, authorizeRoles('barber'), joinSalon);

// Salon owner routes
router.post('/salon/:salonId/add-barber', protect, authorizeRoles('salonOwner'), verifySalonOwnerAccess, addBarberToSalon);

export default router;