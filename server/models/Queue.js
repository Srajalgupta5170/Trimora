import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
  // Core References
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
    index: true
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BarberProfile",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Service Information
  service: {
    type: String,
    required: true
  },
  serviceDuration: {
    type: Number, // in minutes
    default: 30
  },

  // Queue Position & Status
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["waiting", "in-progress", "completed", "cancelled"],
    default: "waiting",
    index: true
  },

  // Timing Information
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  actualDuration: {
    type: Number, // in minutes, calculated after completion
    default: null
  },

  // Additional Metadata
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  cancelReason: {
    type: String,
    default: null
  }
}, { 
  timestamps: true,
  index: {
    fields: { salonId: 1, barberId: 1, status: 1 }
  }
});

// ==================== INDEXES ====================
// Prevent duplicate active queue entries (one customer per barber at a time)
queueSchema.index(
  { userId: 1, barberId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["waiting", "in-progress"] }
    },
    name: "unique_active_queue_per_customer_barber"
  }
);

// Efficient queries for barber's queue
queueSchema.index({ barberId: 1, status: 1, position: 1 });

// Efficient cleanup queries
queueSchema.index({ status: 1, completedAt: 1 });

// Efficient customer queue lookup
queueSchema.index({ userId: 1, status: 1 });

// Salon-level queue queries
queueSchema.index({ salonId: 1, status: 1, createdAt: -1 });

const Queue = mongoose.models.Queue || mongoose.model("Queue", queueSchema);

export default Queue;