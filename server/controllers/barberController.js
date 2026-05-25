import BarberProfile from '../models/BarberProfile.js';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';

// Get barber profile by ID (public view)
export const getBarberProfile = async (req, res) => {
  try {
    const { barberId } = req.params;
    const barber = await BarberProfile.findById(barberId)
      .populate('userId', 'name email')
      .populate('salonId', 'name address');

    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }

    // Get current queue for this barber
    const queue = await Queue.find({
      barberId,
      status: { $in: ['waiting', 'in-progress'] }
    })
      .populate('userId', 'name')
      .sort({ position: 1 });

    // Get services
    const services = await Service.find({ barberId, isActive: true });

    // Calculate estimated wait time (assume 15-20 mins per customer)
    const estimatedWait = queue.length * 15;

    res.json({
      ...barber.toObject(),
      currentQueue: queue,
      queueLength: queue.length,
      estimatedWaitTime: estimatedWait,
      services
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get barber's own profile (barber view)
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await BarberProfile.findOne({ userId })
      .populate('userId', 'name email')
      .populate('salonId', 'name address');

    if (!profile) {
      return res.status(404).json({ message: 'Your barber profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update barber's own profile
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, experience, specializations, basePrice, bio, profileImage } = req.body;

    let profile = await BarberProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Barber profile not found' });
    }

    if (name) profile.name = name;
    if (experience !== undefined) profile.experience = experience;
    if (specializations) profile.specializations = specializations;
    if (basePrice !== undefined) profile.basePrice = basePrice;
    if (bio) profile.bio = bio;
    if (profileImage) profile.profileImage = profileImage;

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get barber's own queue
export const getMyQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await BarberProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Barber profile not found' });
    }

    const queue = await Queue.find({ barberId: profile._id, status: { $in: ['waiting', 'in-progress'] } })
      .populate('userId', 'name email')
      .sort({ position: 1 });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle active status (online/offline)
export const toggleActiveStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await BarberProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Barber profile not found' });
    }

    profile.isActive = !profile.isActive;
    await profile.save();

    res.json({
      message: `You are now ${profile.isActive ? 'online' : 'offline'}`,
      isActive: profile.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'day' } = req.query;

    const profile = await BarberProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Barber profile not found' });
    }

    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'day':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const totalServed = await Queue.countDocuments({
      barberId: profile._id,
      status: 'done',
      updatedAt: { $gte: startDate }
    });

    res.json({
      period,
      totalServed,
      averageRating: profile.rating || 0,
      reviewCount: profile.reviewCount || 0,
      basePricePerService: profile.basePrice,
      estimatedEarnings: totalServed * profile.basePrice
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all barbers in a salon (for customers)
export const getBarbersBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    const barbers = await BarberProfile.find({ salonId, isActive: true })
      .populate('userId', 'name email')
      .select('-password');

    const barbersWithQueueCount = await Promise.all(
      barbers.map(async (barber) => {
        const queueCount = await Queue.countDocuments({
          barberId: barber._id,
          status: { $in: ['waiting', 'in-progress'] }
        });
        return {
          ...barber.toObject(),
          currentQueueCount: queueCount
        };
      })
    );

    res.json(barbersWithQueueCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get barber's services
export const getBarberServices = async (req, res) => {
  try {
    const { barberId } = req.params;
    const services = await Service.find({ barberId, isActive: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
