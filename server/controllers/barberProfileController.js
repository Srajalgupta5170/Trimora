import BarberProfile from '../models/BarberProfile.js';
import Portfolio from '../models/Portfolio.js';
import Service from '../models/Service.js';
import Review from '../models/Review.js';
import User from '../models/user.js';
import SalonMedia from '../models/SalonMedia.js';
import mongoose from 'mongoose';

const getCloudinaryId = (file) => {
  if (file?.public_id) return file.public_id;
  if (file?.filename) return file.filename;
  const url = file?.secure_url || file?.path;
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// ==================== BARBER PROFILE ====================

/**
 * Get barber profile (public view)
 */
export const getBarberProfile = async (req, res) => {
  try {
    const { barberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: 'Invalid barber ID' });
    }

    const barber = await BarberProfile.findById(barberId)
      .populate('userId', 'name email phone')
      .populate('salonId', 'name address');

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Get services
    const services = await Service.find({ barberId, isActive: true });

    // Get portfolio count
    const portfolioCount = await Portfolio.countDocuments({ 
      barberId, 
      isPublished: true 
    });

    // Get average rating
    const reviews = await Review.find({ barberId, status: 'approved' });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 4.5;

    res.json({
      success: true,
      barber: {
        ...barber.toObject(),
        services,
        portfolioCount,
        averageRating: parseFloat(avgRating),
        reviewCount: reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching barber profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get current barber's profile (for editing)
 */
export const getMyProfile = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone')
      .populate('salonId', 'name address');

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const services = await Service.find({ barberId: barber._id });
    const portfolio = await Portfolio.find({ barberId: barber._id, isPublished: true })
      .sort({ displayOrder: 1 });

    res.json({
      success: true,
      barber: barber.toObject(),
      services,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching my profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update barber profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { bio, experience, specializations, isAvailable } = req.body;

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    if (bio !== undefined) barber.bio = bio;
    if (experience !== undefined) barber.experience = experience;
    if (specializations !== undefined) barber.specializations = specializations;
    if (isAvailable !== undefined) barber.isActive = isAvailable;

    await barber.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      barber
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    barber.profileImage = req.file.secure_url || req.file.path;
    await barber.save();

    res.json({
      success: true,
      message: 'Profile image updated',
      imageUrl: req.file.secure_url || req.file.path
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== SERVICES ====================

/**
 * Create service
 */
export const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const service = new Service({
      barberId: barber._id,
      name,
      description,
      price,
      duration: duration || 30
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get my services
 */
export const getMyServices = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const services = await Service.find({ barberId: barber._id });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update service
 */
export const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, price, duration, isActive } = req.body;

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const service = await Service.findOne({ _id: serviceId, barberId: barber._id });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete service
 */
export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const result = await Service.deleteOne({ _id: serviceId, barberId: barber._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service deleted'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== PORTFOLIO ====================

/**
 * Upload portfolio image
 */
export const uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { title, description, category } = req.body;

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    // Normalize category - convert to match enum
    const validCategories = ['Haircut', 'Beard', 'Design', 'Fade', 'Transformation', 'Other'];
    let normalizedCategory = category || 'Other';
    
    // Handle lowercase or different cases
    if (normalizedCategory) {
      const found = validCategories.find(
        c => c.toLowerCase() === normalizedCategory.toLowerCase()
      );
      normalizedCategory = found || 'Other';
    }

    // Get highest displayOrder
    const lastImage = await Portfolio.findOne({ barberId: barber._id })
      .sort({ displayOrder: -1 });

    const displayOrder = lastImage ? lastImage.displayOrder + 1 : 0;

    const portfolio = new Portfolio({
      barberId: barber._id,
      imageUrl: req.file.secure_url || req.file.path,
      cloudinaryId: getCloudinaryId(req.file),
      title: title || 'Work Sample',
      description,
      category: normalizedCategory,
      displayOrder
    });

    await portfolio.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio image uploaded',
      portfolio
    });
  } catch (error) {
    console.error('Error uploading portfolio:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get barber's portfolio
 */
export const getPortfolio = async (req, res) => {
  try {
    const { barberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: 'Invalid barber ID' });
    }

    const portfolio = await Portfolio.find({ barberId, isPublished: true })
      .sort({ displayOrder: 1 });

    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get my portfolio (for editing)
 */
export const getMyPortfolio = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const portfolio = await Portfolio.find({ barberId: barber._id })
      .sort({ displayOrder: 1 });

    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete portfolio image
 */
export const deletePortfolioImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const result = await Portfolio.deleteOne({ _id: imageId, barberId: barber._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      success: true,
      message: 'Image deleted'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update portfolio image order
 */
export const updatePortfolioOrder = async (req, res) => {
  try {
    const { images } = req.body; // Array of {id, displayOrder}

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    for (const img of images) {
      await Portfolio.updateOne(
        { _id: img.id, barberId: barber._id },
        { displayOrder: img.displayOrder }
      );
    }

    res.json({
      success: true,
      message: 'Portfolio order updated'
    });
  } catch (error) {
    console.error('Error updating portfolio order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== REVIEWS ====================

/**
 * Get barber reviews
 */
export const getBarberReviews = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: 'Invalid barber ID' });
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ barberId, status: 'approved' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name profileImage');

    const total = await Review.countDocuments({ barberId, status: 'approved' });

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== SALON MEDIA ====================

/**
 * Get salon media
 */
export const getSalonMedia = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const media = await SalonMedia.findOne({ salonId: barber.salonId });

    res.json({
      success: true,
      media: media || {}
    });
  } catch (error) {
    console.error('Error fetching salon media:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== STATISTICS ====================

/**
 * Get barber statistics
 */
export const getBarberStats = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user._id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const portfolioCount = await Portfolio.countDocuments({ barberId: barber._id });
    const serviceCount = await Service.countDocuments({ barberId: barber._id, isActive: true });
    const reviewCount = await Review.countDocuments({ barberId: barber._id, status: 'approved' });

    const reviews = await Review.find({ barberId: barber._id, status: 'approved' });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({
      success: true,
      stats: {
        totalServices: serviceCount,
        totalPortfolio: portfolioCount,
        totalReviews: reviewCount,
        averageRating: parseFloat(avgRating || 0),
        totalEarnings: barber.totalEarnings || 0,
        totalServiced: barber.totalServices || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== LEAVE/REMOVE SALON ====================

/**
 * Barber leaves salon
 */
export const leaveSalon = async (req, res) => {
  try {
    const barberId = req.user.id;

    const barber = await BarberProfile.findOne({ userId: barberId });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const salonId = barber.salonId;
    const salonName = barber.name;

    // Delete the barber profile
    await BarberProfile.deleteOne({ userId: barberId });

    res.json({
      success: true,
      message: 'Successfully left the salon',
      salonId
    });
  } catch (error) {
    console.error('Error leaving salon:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Salon owner removes a barber
 */
export const removeBarber = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { barberUserIdOrId } = req.params;

    // Try to find by BarberProfile ID first, then by user ID
    let barber = await BarberProfile.findById(barberUserIdOrId);
    
    if (!barber) {
      // Try to find by user ID
      barber = await BarberProfile.findOne({ userId: barberUserIdOrId });
    }

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Verify owner owns this salon
    const Salon = mongoose.model('Salon');
    const salon = await Salon.findById(barber.salonId);

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    if (salon.ownerId.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to remove this barber' });
    }

    // Get barber name before deletion
    const barberName = barber.name;

    // Delete the barber profile
    await BarberProfile.deleteOne({ _id: barber._id });

    res.json({
      success: true,
      message: `${barberName} has been removed from the salon`,
      barberName,
      salonId: barber.salonId
    });
  } catch (error) {
    console.error('Error removing barber:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
