import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BarberProfile',
      required: true,
      index: true
    },

    // Image details
    imageUrl: {
      type: String,
      required: true
    },

    cloudinaryId: {
      type: String,
      default: null
    },

    // Metadata
    title: {
      type: String,
      default: 'Work Sample'
    },

    description: {
      type: String,
      default: '',
      maxlength: 200
    },

    category: {
      type: String,
      enum: ['Haircut', 'Beard', 'Design', 'Fade', 'Transformation', 'Other'],
      default: 'Other'
    },

    // Engagement
    likes: {
      type: Number,
      default: 0,
      min: 0
    },

    // Display
    displayOrder: {
      type: Number,
      default: 0
    },

    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for queries
portfolioSchema.index({ barberId: 1, isPublished: 1 });
portfolioSchema.index({ category: 1 });

export default mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
