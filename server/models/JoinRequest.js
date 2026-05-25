import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    barberName: String,
    barberEmail: String,
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true
    },
    salonName: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    experience: {
      type: Number,
      default: 0
    },
    specializations: [String],
    basePrice: {
      type: Number,
      default: 150
    },
    bio: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

export default mongoose.model('JoinRequest', joinRequestSchema);
