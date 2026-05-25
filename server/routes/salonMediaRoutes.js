import express from 'express';
import {
  getSalonMedia,
  getMySalonMedia,
  updateSalonInfo,
  uploadLogo,
  uploadBanner,
  addGalleryImage,
  removeGalleryImage,
  updateGalleryOrder,
  getGallery
} from '../controllers/salonMediaController.js';
import { protect, authorizeRoles } from '../middlewares/roleMiddleware.js';
import upload from '../middlewares/multerMiddleware.js';

const router = express.Router();

// ===== DEBUG ROUTE =====
router.get('/me/debug', protect, (req, res) => {
  res.json({
    userId: req.user?._id,
    userRole: req.user?.role,
    message: 'User authenticated'
  });
});

// ===== PUBLIC ROUTES =====
// Get salon media
router.get('/salon/:salonId/media', getSalonMedia);

// Get salon gallery
router.get('/salon/:salonId/gallery', getGallery);

// ===== SALON OWNER ROUTES =====
// Get my salon media
router.get('/me/media', protect, authorizeRoles('salonOwner'), getMySalonMedia);

// Update salon info (description, ambiance, brand colors)
router.put('/me/info', protect, authorizeRoles('salonOwner'), updateSalonInfo);

// Upload logo
router.post('/me/logo', 
  protect, 
  authorizeRoles('salonOwner'),
  upload.single('logo'),
  uploadLogo
);

// Upload banner
router.post('/me/banner', 
  protect, 
  authorizeRoles('salonOwner'),
  upload.single('banner'),
  uploadBanner
);

// Add gallery image
router.post('/me/gallery', 
  protect, 
  authorizeRoles('salonOwner'),
  upload.single('image'),
  addGalleryImage
);

// Remove gallery image
router.delete('/me/gallery/:imageIndex', protect, authorizeRoles('salonOwner'), removeGalleryImage);

// Update gallery order
router.put('/me/gallery/order', protect, authorizeRoles('salonOwner'), updateGalleryOrder);

export default router;
