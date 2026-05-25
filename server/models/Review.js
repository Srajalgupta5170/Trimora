import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BarberProfile',
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },

    // Rating
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    // Review Text
    comment: {
      type: String,
      maxlength: 500,
      default: ''
    },

    // Review Aspects
    aspects: {
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      skillLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },
      customerService: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      }
    },

    // Reviewer Info
    reviewerName: String,
    reviewerImage: String,

    // Engagement
    helpfulCount: {
      type: Number,
      default: 0
    },

    // Barber Response
    barberResponse: {
      text: String,
      createdAt: Date
    },

    // Status
    isVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Index for efficient queries
reviewSchema.index({ barberId: 1, rating: 1 });
reviewSchema.index({ barberId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
