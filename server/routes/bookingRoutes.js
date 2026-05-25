import express from 'express';
import * as salonController from '../controllers/salonController.js';
import * as barberController from '../controllers/barberController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { requestJoinSalon } from '../controllers/joinRequestController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';
import { verifySalonOwnerAccess } from '../middlewares/salonOwnerAuthMiddleware.js';

const router = express.Router();

// ===== SALON ROUTES (Public) =====
router.get('/salons', salonController.getAllSalons);
router.get('/salons/:salonId', salonController.getSalonById);
router.get('/salons/:salonId/barbers', salonController.getBarbersBySalon);

// ===== BARBER ROUTES (Public) =====
router.get('/barbers/:barberId', barberController.getBarberProfile);
router.get('/barbers/:barberId/services', barberController.getBarberServices);
router.get('/salon/:salonId/barbers', barberController.getBarbersBySalon);

// ===== BARBER PROTECTED ROUTES =====
router.get('/barber/my-profile', protect, authorizeRoles('barber'), barberController.getMyProfile);
router.put('/barber/my-profile', protect, authorizeRoles('barber'), barberController.updateMyProfile);
router.get('/barber/my-queue', protect, authorizeRoles('barber'), barberController.getMyQueue);
router.post('/barber/toggle-status', protect, authorizeRoles('barber'), barberController.toggleActiveStatus);
router.get('/barber/stats', protect, authorizeRoles('barber'), barberController.getStats);
router.post('/join-salon', protect, authorizeRoles('barber'), requestJoinSalon);

// ===== SALON OWNER ROUTES =====
router.post('/salon', protect, authorizeRoles('salonOwner'), salonController.registerSalon);
router.get('/my-salons', protect, authorizeRoles('salonOwner'), salonController.getOwnedSalons);
router.put('/salon/:salonId', protect, authorizeRoles('salonOwner'), verifySalonOwnerAccess, salonController.updateSalon);
router.get('/salon/:salonId/queues', protect, authorizeRoles('salonOwner'), verifySalonOwnerAccess, salonController.getSalonQueues);
router.get('/salon/:salonId/stats', protect, authorizeRoles('salonOwner'), verifySalonOwnerAccess, salonController.getSalonStats);

// ===== APPOINTMENT ROUTES (Protected) =====
router.post('/appointments/book', protect, authorizeRoles('customer'), appointmentController.bookAppointment);
router.get('/appointments/my-active', protect, authorizeRoles('customer'), appointmentController.getCustomerAppointment);
router.delete('/appointments/:appointmentId/cancel', protect, authorizeRoles('customer'), appointmentController.cancelAppointment);

export default router;
