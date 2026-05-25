import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import BarberProfile from '../models/BarberProfile.js';
import mongoose from 'mongoose';

/**
 * Submit a review for a barber
 */
export const submitReview = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { rating, comment, aspects, appointmentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: 'Invalid barber ID' });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if barber exists
    const barber = await BarberProfile.findById(barberId);
    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Check if user already reviewed this barber (for this appointment or recently)
    const existingReview = await Review.findOne({
      barberId,
      userId: req.user.id,
      appointmentId
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this service' });
    }

    // Create review
    const review = new Review({
      barberId,
      userId: req.user.id,
      appointmentId: appointmentId || null,
      rating,
      comment: comment || '',
      aspects: {
        cleanliness: aspects?.cleanliness || rating,
        professionalism: aspects?.professionalism || rating,
        skillLevel: aspects?.skillLevel || rating,
        customerService: aspects?.customerService || rating
      },
      reviewerName: req.user.name,
      reviewerImage: req.user.profileImage || null,
      isVerified: !!appointmentId,
      status: 'pending' // Require moderation
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted for moderation',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get reviews for a barber (public)
 */
export const getBarberReviews = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { page = 1, limit = 10, category = null } = req.query;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: 'Invalid barber ID' });
    }

    const skip = (page - 1) * limit;

    const query = {
      barberId,
      status: 'approved'
    };

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name profileImage');

    const total = await Review.countDocuments(query);

    // Calculate statistics
    const allReviews = await Review.find(query);
    const stats = {
      totalReviews: allReviews.length,
      averageRating: allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0,
      ratingDistribution: {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length
      },
      averageAspects: {
        cleanliness: allReviews.filter(r => r.aspects?.cleanliness)
          .reduce((sum, r) => sum + r.aspects.cleanliness, 0) / allReviews.filter(r => r.aspects?.cleanliness).length || 0,
        professionalism: allReviews.filter(r => r.aspects?.professionalism)
          .reduce((sum, r) => sum + r.aspects.professionalism, 0) / allReviews.filter(r => r.aspects?.professionalism).length || 0,
        skillLevel: allReviews.filter(r => r.aspects?.skillLevel)
          .reduce((sum, r) => sum + r.aspects.skillLevel, 0) / allReviews.filter(r => r.aspects?.skillLevel).length || 0,
        customerService: allReviews.filter(r => r.aspects?.customerService)
          .reduce((sum, r) => sum + r.aspects.customerService, 0) / allReviews.filter(r => r.aspects?.customerService).length || 0
      }
    };

    res.json({
      success: true,
      reviews,
      stats,
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

/**
 * Mark review as helpful
 */
export const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Error marking review:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Respond to a review (barber only)
 */
export const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const review = await Review.findOne({ _id: reviewId, barberId: barber._id });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.barberResponse = {
      text: text.trim(),
      createdAt: new Date()
    };

    await review.save();

    res.json({
      success: true,
      message: 'Response added to review',
      barberResponse: review.barberResponse
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get pending reviews (for moderation - admin/barber)
 */
export const getPendingReviews = async (req, res) => {
  try {
    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const reviews = await Review.find({ barberId: barber._id, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profileImage');

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Approve/reject review (barber only)
 */
export const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const barber = await BarberProfile.findOne({ userId: req.user.id });

    if (!barber) {
      return res.status(404).json({ error: 'Barber profile not found' });
    }

    const review = await Review.findOne({ _id: reviewId, barberId: barber._id });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.status = action === 'approve' ? 'approved' : 'rejected';
    await review.save();

    res.json({
      success: true,
      message: `Review ${action}ed`,
      review
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
