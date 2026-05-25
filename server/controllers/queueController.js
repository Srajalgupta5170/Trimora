import Queue from '../models/Queue.js';
import BarberProfile from '../models/BarberProfile.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import Earnings from '../models/Earnings.js';
import mongoose from 'mongoose';

// ==================== CONSTANTS ====================
const SERVICE_DURATIONS = {
  'Haircut': 30,
  'Beard': 20,
  'Hair + Beard': 50,
  'Shampoo': 15,
  'Other': 30
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get service duration (from database or default)
 */
const getServiceDuration = async (serviceName, barberId) => {
  try {
    // Try to find service in database
    const service = await Service.findOne({ 
      barberId, 
      name: serviceName,
      isActive: true 
    });

    if (service) {
      return service.duration || SERVICE_DURATIONS[serviceName] || 30;
    }

    // Fall back to predefined durations
    return SERVICE_DURATIONS[serviceName] || 30;
  } catch (error) {
    console.error('Error getting service duration:', error);
    return SERVICE_DURATIONS[serviceName] || 30;
  }
};

/**
 * Calculate estimated wait time based on customers ahead
 * Uses actual service durations from queue entries
 */
const calculateEstimatedWaitTime = async (barberId, excludeQueueId = null) => {
  try {
    const queue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] },
      _id: { $ne: excludeQueueId }
    })
      .sort({ position: 1 })
      .select('serviceDuration status position');

    let totalWaitTime = 0;
    for (const entry of queue) {
      totalWaitTime += entry.serviceDuration || 30;
    }

    return totalWaitTime;
  } catch (error) {
    console.error('Error calculating wait time:', error);
    return 0;
  }
};

/**
 * Recalculate positions for a barber's queue
 * Removes gaps and maintains strict ordering
 */
const recalculatePositions = async (barberId, session = null) => {
  try {
    // Get queue sorted by creation time
    const queryObj = { barberId, status: { $in: ['waiting', 'in-progress'] } };
    
    let query = Queue.find(queryObj).sort({ createdAt: 1 });
    if (session) query = query.session(session);
    
    const queue = await query;

    // Update each position
    for (let i = 0; i < queue.length; i++) {
      queue[i].position = i + 1;
      await queue[i].save(session ? { session } : {});
    }

    return queue;
  } catch (error) {
    console.error('Error recalculating positions:', error);
    throw error;
  }
};

/**
 * Update estimated wait times for all customers in a barber's queue
 */
const updateQueueEstimates = async (barberId, session = null) => {
  try {
    const queue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    }).sort({ position: 1 });

    let cumulativeTime = 0;
    for (const entry of queue) {
      entry.estimatedWaitTime = cumulativeTime;
      await entry.save(session ? { session } : {});
      cumulativeTime += entry.serviceDuration || 30;
    }

    return queue;
  } catch (error) {
    console.error('Error updating queue estimates:', error);
    throw error;
  }
};

/**
 * Emit queue update to barber and customers
 */
const emitQueueUpdate = (io, barberId, action, details = {}) => {
  if (!io) return;

  io.to(`barber_${barberId}`).emit('queueUpdated', {
    action,
    timestamp: new Date(),
    ...details
  });
};

/**
 * Emit customer notification
 */
const emitCustomerNotification = (io, userId, eventName, data) => {
  if (!io) return;

  io.to(`user_${userId}`).emit(eventName, {
    timestamp: new Date(),
    ...data
  });
};

// ==================== QUEUE OPERATIONS ====================

/**
 * Customer joins queue (with comprehensive validation)
 */
export const joinQueue = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { barberId, salonId, service } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    // ✅ VALIDATION: Required fields
    if (!barberId || !salonId || !service) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Required fields: barberId, salonId, service' 
      });
    }

    // ✅ VALIDATION: Service name is not empty
    if (typeof service !== 'string' || service.trim().length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Service name must be a non-empty string' 
      });
    }

    // ✅ VALIDATION: Barber exists and is active
    const barber = await BarberProfile.findById(barberId).session(session);
    if (!barber) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (!barber.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Barber is not currently active' });
    }

    // ✅ VALIDATION: Barber works at this salon
    if (barber.salonId.toString() !== salonId) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Barber does not work at this salon' 
      });
    }

    // ✅ DUPLICATE PREVENTION: Check for existing active entry
    // This should be prevented by the unique index, but we check anyway
    const existingEntry = await Queue.findOne({
      userId,
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    }).session(session);

    if (existingEntry) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'You are already in this barber\'s queue',
        position: existingEntry.position,
        estimatedWaitTime: existingEntry.estimatedWaitTime
      });
    }

    // ✅ GET SERVICE DURATION
    const serviceDuration = await getServiceDuration(service.trim(), barberId);

    // ✅ CALCULATE POSITION
    const queueCount = await Queue.countDocuments({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    }).session(session);

    const position = queueCount + 1;

    // ✅ CALCULATE ESTIMATED WAIT TIME
    const estimatedWaitTime = await calculateEstimatedWaitTime(barberId);

    // ✅ CREATE QUEUE ENTRY
    const queueEntry = new Queue({
      salonId,
      barberId,
      userId,
      service: service.trim(),
      serviceDuration,
      position,
      status: 'waiting',
      estimatedWaitTime,
      joinedAt: new Date()
    });

    await queueEntry.save({ session });
    await session.commitTransaction();

    // ✅ EMIT SOCKET EVENT (outside transaction)
    const updatedQueue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name email phone')
      .sort({ position: 1 });

    emitQueueUpdate(io, barberId, 'customerJoined', {
      newCustomer: queueEntry,
      queue: updatedQueue
    });

    // Notify customer
    emitCustomerNotification(io, userId, 'joinedQueue', {
      message: `Successfully joined queue! Your position: #${position}`,
      position,
      estimatedWaitTime,
      barberName: barber.name
    });

    res.status(201).json({
      success: true,
      message: `Added to queue! Position: #${position}. Estimated wait: ${estimatedWaitTime} minutes`,
      queueEntry: {
        _id: queueEntry._id,
        position,
        estimatedWaitTime,
        service: queueEntry.service,
        serviceDuration,
        status: queueEntry.status
      }
    });
  } catch (error) {
    await session.abortTransaction();
    
    // Handle unique index violation (duplicate entry)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You are already in a queue with this barber. Please leave your current queue first.',
        code: 'DUPLICATE_QUEUE_ENTRY'
      });
    }

    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Customer leaves queue
 */
export const leaveQueue = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const io = req.app.get('io');

    // ✅ FIND CUSTOMER'S ACTIVE QUEUE ENTRY
    const queueEntry = await Queue.findOne({
      userId,
      status: { $in: ['waiting', 'in-progress'] }
    }).session(session);

    if (!queueEntry) {
      await session.abortTransaction();
      return res.status(404).json({ 
        message: 'You are not in any active queue' 
      });
    }

    const { barberId, position } = queueEntry;

    // ✅ MARK AS CANCELLED
    queueEntry.status = 'cancelled';
    queueEntry.cancelReason = 'Customer left';
    await queueEntry.save({ session });

    // ✅ RECALCULATE POSITIONS
    const updatedQueue = await recalculatePositions(barberId, session);
    await updateQueueEstimates(barberId, session);

    await session.commitTransaction();

    // ✅ EMIT SOCKET EVENTS (outside transaction)
    const finalQueue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name email')
      .sort({ position: 1 });

    emitQueueUpdate(io, barberId, 'customerLeft', {
      leftPosition: position,
      queue: finalQueue
    });

    res.json({
      success: true,
      message: 'You have left the queue',
      leftPosition: position
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get barber's queue (public - for customers)
 */
export const getBarberQueuePublic = async (req, res) => {
  try {
    const { barberId } = req.params;

    const queue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    }).sort({ position: 1 });

    res.json({
      success: true,
      barberId,
      queueLength: queue.length,
      waitingCount: queue.filter(q => q.status === 'waiting').length,
      servingCount: queue.filter(q => q.status === 'in-progress').length,
      estimatedWaitTime: queue.reduce((sum, q) => sum + (q.serviceDuration || 30), 0)
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get barber's queue (barber dashboard)
 */
export const getBarberQueue = async (req, res) => {
  try {
    const { barberId } = req.params;
    const userId = req.user.id;

    // ✅ AUTHORIZATION: Verify barber ownership
    const barber = await BarberProfile.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (barber.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You can only access your own queue'
      });
    }

    const queue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name email phone')
      .sort({ position: 1 });

    res.json({
      success: true,
      barberId,
      waitingCount: queue.filter(q => q.status === 'waiting').length,
      servingCount: queue.filter(q => q.status === 'in-progress').length,
      queue
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get customer's queue position (across all barbers)
 */
export const getMyQueuePosition = async (req, res) => {
  try {
    const userId = req.user.id;

    const queueEntry = await Queue.findOne({
      userId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('barberId', 'name phone')
      .populate('salonId', 'name address');

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'You are not in any queue'
      });
    }

    res.json({
      success: true,
      position: queueEntry.position,
      status: queueEntry.status,
      service: queueEntry.service,
      serviceDuration: queueEntry.serviceDuration,
      estimatedWaitTime: queueEntry.estimatedWaitTime,
      barber: queueEntry.barberId,
      salon: queueEntry.salonId,
      joinedAt: queueEntry.joinedAt
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get customer's status for specific barber
 */
export const getMyStatus = async (req, res) => {
  try {
    const { barberId } = req.params;
    const userId = req.user.id;

    const myEntry = await Queue.findOne({
      userId,
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    });

    if (!myEntry) {
      return res.status(404).json({
        success: false,
        message: 'You are not in this barber\'s queue'
      });
    }

    res.json({
      success: true,
      position: myEntry.position,
      status: myEntry.status,
      service: myEntry.service,
      serviceDuration: myEntry.serviceDuration,
      estimatedWaitTime: myEntry.estimatedWaitTime,
      message: myEntry.status === 'in-progress'
        ? 'You are being served now!'
        : `You are #${myEntry.position} in queue. Estimated wait: ${myEntry.estimatedWaitTime} minutes`
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Barber calls next customer
 */
export const callNextCustomer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { barberId } = req.params;
    const userId = req.user.id;
    const io = req.app.get('io');

    // ✅ AUTHORIZATION: Verify barber ownership
    const barber = await BarberProfile.findById(barberId).session(session);
    if (!barber) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (barber.userId.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({
        message: 'Unauthorized: You can only manage your own queue'
      });
    }

    // ✅ COMPLETE PREVIOUS IN-PROGRESS (if any)
    await Queue.updateMany(
      { barberId, status: 'in-progress' },
      {
        $set: {
          status: 'waiting',
          startedAt: null
        }
      },
      { session }
    );

    // ✅ GET NEXT WAITING CUSTOMER
    const nextInQueue = await Queue.findOne({
      barberId,
      status: 'waiting'
    })
      .sort({ position: 1 })
      .session(session);

    if (!nextInQueue) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'No customers waiting'
      });
    }

    // ✅ MOVE TO IN-PROGRESS
    nextInQueue.status = 'in-progress';
    nextInQueue.startedAt = new Date();
    await nextInQueue.save({ session });

    // ✅ RECALCULATE POSITIONS
    const updatedQueue = await recalculatePositions(barberId, session);

    await session.commitTransaction();

    // ✅ EMIT SOCKET EVENTS (outside transaction)
    const fullQueue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name phone')
      .sort({ position: 1 });

    emitQueueUpdate(io, barberId, 'nextCalled', {
      currentCustomer: nextInQueue,
      queue: fullQueue
    });

    emitCustomerNotification(io, nextInQueue.userId._id, 'yourTurn', {
      message: 'Your turn! Please come to the barber chair',
      barberName: barber.name,
      barberId,
      service: nextInQueue.service
    });

    res.json({
      success: true,
      message: `Called: ${nextInQueue.userId.name || 'Customer'}`,
      customer: {
        _id: nextInQueue.userId._id,
        name: nextInQueue.userId.name,
        service: nextInQueue.service
      }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Barber completes service
 */
export const completeService = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { barberId } = req.params;
    const { servicePrice = 0 } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    // ✅ AUTHORIZATION: Verify barber ownership
    const barber = await BarberProfile.findById(barberId).session(session);
    if (!barber) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (barber.userId.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({
        message: 'Unauthorized: You can only manage your own queue'
      });
    }

    // ✅ FIND IN-PROGRESS CUSTOMER
    const inProgress = await Queue.findOne({
      barberId,
      status: 'in-progress'
    }).session(session);

    if (!inProgress) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'No customer currently being served'
      });
    }

    // ✅ CALCULATE ACTUAL DURATION
    const actualDuration = inProgress.startedAt
      ? Math.round((Date.now() - inProgress.startedAt) / 60000) // minutes
      : inProgress.serviceDuration;

    // ✅ COMPLETE SERVICE
    inProgress.status = 'completed';
    inProgress.completedAt = new Date();
    inProgress.actualDuration = actualDuration;
    await inProgress.save({ session });

    // ✅ CREATE APPOINTMENT RECORD
    const appointment = await Appointment.create(
      [{
        customerId: inProgress.userId,
        barberId,
        salonId: inProgress.salonId,
        status: 'completed',
        completedTime: new Date(),
        service: inProgress.service,
        actualDuration,
        price: servicePrice
      }],
      { session }
    );

    // ✅ RECORD EARNINGS
    const earningsRecord = new Earnings({
      appointmentId: appointment[0]._id,
      barberId,
      salonId: inProgress.salonId,
      customerId: inProgress.userId,
      amount: servicePrice,
      service: inProgress.service,
      actualDuration,
      date: new Date(),
      status: 'completed'
    });
    await earningsRecord.save({ session });

    // ✅ RECALCULATE POSITIONS
    const updatedQueue = await recalculatePositions(barberId, session);
    await updateQueueEstimates(barberId, session);

    await session.commitTransaction();

    // ✅ EMIT SOCKET EVENTS (outside transaction)
    const finalQueue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name')
      .sort({ position: 1 });

    emitQueueUpdate(io, barberId, 'serviceCompleted', {
      completedCustomer: inProgress,
      actualDuration,
      queue: finalQueue
    });

    emitCustomerNotification(io, inProgress.userId, 'serviceCompleted', {
      message: 'Your service has been completed. Thank you for visiting!',
      actualDuration,
      service: inProgress.service
    });

    res.json({
      success: true,
      message: 'Service completed',
      completedCustomer: {
        name: inProgress.userId.name,
        service: inProgress.service
      },
      actualDuration,
      price: servicePrice,
      remainingQueueLength: finalQueue.length
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get barber's statistics
 */
export const getQueueStats = async (req, res) => {
  try {
    const { barberId } = req.params;
    const userId = req.user.id;

    // ✅ AUTHORIZATION: Verify barber ownership
    const barber = await BarberProfile.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    if (barber.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Unauthorized: You can only view your own stats'
      });
    }

    // ✅ TODAY'S STATS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalServedToday = await Queue.countDocuments({
      barberId,
      status: 'completed',
      completedAt: { $gte: today }
    });

    const totalEarningsToday = await Earnings.aggregate([
      {
        $match: {
          barberId: new mongoose.Types.ObjectId(barberId),
          date: { $gte: today },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const waitingCount = await Queue.countDocuments({
      barberId,
      status: 'waiting'
    });

    const inProgressCount = await Queue.countDocuments({
      barberId,
      status: 'in-progress'
    });

    res.json({
      success: true,
      today: {
        totalServed: totalServedToday,
        totalEarnings: totalEarningsToday[0]?.total || 0,
        averageServiceTime: totalServedToday > 0
          ? Math.round((totalEarningsToday[0]?.total || 0) / totalServedToday)
          : 0
      },
      currentStatus: {
        waitingCount,
        inProgressCount,
        totalActive: waitingCount + inProgressCount
      },
      barberStatus: barber.isActive ? 'active' : 'inactive'
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * CLEANUP: Remove completed entries older than 24 hours
 * Should be run by a scheduled job (e.g., node-cron)
 */
export const cleanupCompletedEntries = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await Queue.deleteMany({
      status: 'completed',
      completedAt: { $lt: oneDayAgo }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} completed queue entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * CLEANUP: Cancel stale waiting entries (customer didn't show up)
 * Should be run by a scheduled job
 */
export const cleanupStaleEntries = async (req, res) => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await Queue.updateMany(
      {
        status: 'waiting',
        joinedAt: { $lt: twoHoursAgo }
      },
      {
        $set: {
          status: 'cancelled',
          cancelReason: 'Stale entry: Customer did not show up'
        }
      }
    );

    // Recalculate positions for affected barbers
    const affectedEntries = await Queue.distinct('barberId', {
      status: 'cancelled',
      cancelReason: 'Stale entry: Customer did not show up'
    });

    for (const barberId of affectedEntries) {
      await recalculatePositions(barberId);
    }

    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} stale queue entries`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

export default {
  joinQueue,
  leaveQueue,
  getBarberQueuePublic,
  getBarberQueue,
  getMyQueuePosition,
  getMyStatus,
  callNextCustomer,
  completeService,
  getQueueStats,
  cleanupCompletedEntries,
  cleanupStaleEntries
};
