import express from 'express';
import upload from '../middlewares/multerMiddleware.js';
import {
  uploadSalonImage,
  uploadMultipleImages,
  getSalonGallery,
  deleteSalonImage,
  setMainImage,
} from '../controllers/imageController.js';
import { protect } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Upload single image (Cloudinary-backed)
router.post('/:salonId/upload', protect, upload.single('image'), uploadSalonImage);

// Upload multiple images (Cloudinary-backed)
router.post('/:salonId/upload-multiple', protect, upload.array('images', 10), uploadMultipleImages);

// Get gallery
router.get('/:salonId/gallery', getSalonGallery);

// Delete image
router.delete('/:salonId/gallery/:imageIndex', protect, deleteSalonImage);

// Set main image
router.put('/:salonId/gallery/:imageIndex/set-main', protect, setMainImage);

export default router;
