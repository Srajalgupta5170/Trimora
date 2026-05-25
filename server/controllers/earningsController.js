import Earnings from '../models/Earnings.js';
import BarberProfile from '../models/BarberProfile.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import mongoose from 'mongoose';

// Record earnings when service is completed
export const recordEarnings = async (appointmentId, barberId, salonId, amount, serviceName) => {
  try {
    const earning = new Earnings({
      appointmentId,
      barberId,
      salonId,
      amount,
      service: serviceName,
      status: 'completed',
    });

    await earning.save();
    return earning;
  } catch (error) {
    console.error('Error recording earnings:', error);
  }
};

// Get barber earnings overview
export const getBarberEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedBarberId = req.query.barberId;

    // Get all barber profiles for this user
    const profiles = await BarberProfile.find({ userId });

    if (profiles.length === 0) {
      return res.json({
        message: 'No barber profiles found',
        totalEarnings: 0,
        todayEarnings: 0,
        customersServed: 0,
      });
    }

    let barberIds = profiles.map((p) => p._id);

    // Optional: narrow overview to a specific owned barber profile
    if (requestedBarberId) {
      const ownsRequestedProfile = barberIds.some(
        (id) => id.toString() === requestedBarberId.toString()
      );
      if (!ownsRequestedProfile) {
        return res.status(403).json({ message: 'Unauthorized barberId' });
      }
      barberIds = barberIds.filter(
        (id) => id.toString() === requestedBarberId.toString()
      );
    }

    // Get all earnings
    const allEarnings = await Earnings.find({
      barberId: { $in: barberIds },
      status: 'completed',
    });

    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEarnings = await Earnings.find({
      barberId: { $in: barberIds },
      status: 'completed',
      date: { $gte: today, $lt: tomorrow },
    });

    // Get customers served
    const completedAppointments = await Appointment.countDocuments({
      barberId: { $in: barberIds },
      status: 'completed',
    });

    const totalAmount = allEarnings.reduce((sum, e) => sum + e.amount, 0);
    const todayAmount = todayEarnings.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      totalEarnings: totalAmount,
      todayEarnings: todayAmount,
      customersServed: completedAppointments,
      earningsBreakdown: {
        byDate: await getEarningsByDate(barberIds),
        bySalon: await getEarningsBySalon(barberIds),
      },
      recentTransactions: allEarnings.slice(-10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salon owner earnings overview
export const getSalonEarnings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get salon
    const salon = await Salon.findOne({ ownerId: userId });
    if (!salon) {
      return res.status(403).json({ message: 'You are not a salon owner' });
    }

    // Get all earnings for this salon
    const allEarnings = await Earnings.find({
      salonId: salon._id,
      status: 'completed',
    })
      .populate('barberId', 'name')
      .sort({ date: -1 });

    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEarnings = await Earnings.find({
      salonId: salon._id,
      status: 'completed',
      date: { $gte: today, $lt: tomorrow },
    });

    // Get this week's earnings
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekEarnings = await Earnings.find({
      salonId: salon._id,
      status: 'completed',
      date: { $gte: weekAgo, $lt: tomorrow },
    });

    // Earnings per barber
    const perBarber = await getEarningsPerBarber(salon._id);

    const totalAmount = allEarnings.reduce((sum, e) => sum + e.amount, 0);
    const todayAmount = todayEarnings.reduce((sum, e) => sum + e.amount, 0);
    const weekAmount = weekEarnings.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      salonId: salon._id,
      totalEarnings: totalAmount,
      todayEarnings: todayAmount,
      weekEarnings: weekAmount,
      stats: {
        servicesCompleted: allEarnings.length,
        todayServices: todayEarnings.length,
        weekServices: weekEarnings.length,
      },
      earningsPerBarber: perBarber,
      dailyBreakdown: await getDailyEarnings(salon._id, 30), // Last 30 days
      recentTransactions: allEarnings.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function: Get earnings by date
async function getEarningsByDate(barberIds) {
  const barberObjectIds = barberIds.map((id) => new mongoose.Types.ObjectId(id));
  const earnings = await Earnings.aggregate([
    {
      $match: {
        barberId: { $in: barberObjectIds },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date',
          },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
  ]);

  return earnings;
}

// Helper function: Get earnings by salon
async function getEarningsBySalon(barberIds) {
  const barberObjectIds = barberIds.map((id) => new mongoose.Types.ObjectId(id));
  const earnings = await Earnings.aggregate([
    {
      $match: {
        barberId: { $in: barberObjectIds },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$salonId',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'salons',
        localField: '_id',
        foreignField: '_id',
        as: 'salon',
      },
    },
  ]);

  return earnings;
}

// Helper function: Get earnings per barber
async function getEarningsPerBarber(salonId) {
  const earnings = await Earnings.aggregate([
    {
      $match: {
        salonId: new mongoose.Types.ObjectId(salonId),
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$barberId',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        lastEarning: { $max: '$date' },
      },
    },
    {
      $lookup: {
        from: 'barberprofiles',
        localField: '_id',
        foreignField: '_id',
        as: 'barber',
      },
    },
    { $sort: { total: -1 } },
  ]);

  return earnings;
}

// Helper function: Get daily earnings
async function getDailyEarnings(salonId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const earnings = await Earnings.aggregate([
    {
      $match: {
        salonId: new mongoose.Types.ObjectId(salonId),
        status: 'completed',
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date',
          },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return earnings;
}

// Get barber earnings breakdown
export const getBarberEarningsBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;
    const { barberId } = req.params;

    // Get barber profile
    const barber = await BarberProfile.findById(barberId);
    if (!barber) {
      return res.status(404).json({ message: 'Barber profile not found' });
    }
    if (barber.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const earnings = await Earnings.find({
      barberId,
      status: 'completed',
    })
      .populate('appointmentId')
      .sort({ date: -1 });

    res.json({
      barber: barber.name,
      totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0),
      totalServices: earnings.length,
      earnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
