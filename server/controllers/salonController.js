import Salon from '../models/Salon.js';
import BarberProfile from '../models/BarberProfile.js';
import Queue from '../models/Queue.js';
import User from '../models/User.js';

// ===== SALON OWNER ROUTES =====

// Register a new salon (salonOwner only)
export const registerSalon = async (req, res) => {
  try {
    const { name, address, latitude, longitude, description, openingTime, closingTime, image } = req.body;
    const ownerId = req.user.id;

    // ✅ STRICT AUTH: Verify user is salon owner
    if (req.user.role !== 'salonOwner') {
      return res.status(403).json({ message: 'Only salon owners can register salons' });
    }

    // Validate required fields
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Name, address, and location are required' });
    }

    // Create salon
    const salon = await Salon.create({
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      description: description || '',
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '21:00',
      image: image || 'https://images.unsplash.com/photo-1599662150142-3c5dbe2b1a25?w=400&h=300&fit=crop',
      ownerId
    });

    res.status(201).json({
      message: 'Salon registered successfully',
      salon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all salons (public)
export const getAllSalons = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000 } = req.query;

    let salons;
    if (latitude && longitude) {
      // Get nearby salons with geospatial query
      salons = await Salon.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      });
    } else {
      // Get all salons
      salons = await Salon.find().select('-ownerId');
    }

    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single salon details (public)
export const getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Get barbers in this salon
    const barbers = await BarberProfile.find({ salonId: salon._id, isActive: true })
      .populate('userId', 'name email');

    res.json({ salon, barbers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all barbers in a salon (public)
export const getBarbersBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    const barbers = await BarberProfile.find({ salonId, isActive: true })
      .populate('userId', 'name email');

    // Add queue count for each barber (real-time)
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

// Update salon (owner only)
export const updateSalon = async (req, res) => {
  try {
    const salon = req.salon; // Set by middleware
    const { name, address, description, openingTime, closingTime, image } = req.body;

    // ✅ STRICT AUTH: Already verified by verifySalonOwnerAccess middleware

    if (name) salon.name = name;
    if (address) salon.address = address;
    if (description !== undefined) salon.description = description;
    if (openingTime) salon.openingTime = openingTime;
    if (closingTime) salon.closingTime = closingTime;
    if (image) salon.image = image;

    await salon.save();

    res.json({
      message: 'Salon updated successfully',
      salon
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get owner's salons
export const getOwnedSalons = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // ✅ STRICT AUTH: Verify role is salonOwner
    if (req.user.role !== 'salonOwner') {
      return res.status(403).json({ message: 'Only salon owners can view their salons' });
    }

    const salons = await Salon.find({ ownerId });
    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all queues in a salon (owner only)
export const getSalonQueues = async (req, res) => {
  try {
    const salon = req.salon; // Set by middleware

    // ✅ STRICT AUTH: Already verified by verifySalonOwnerAccess middleware

    // Get all queues for all barbers in this salon
    const queues = await Queue.find({ salonId: salon._id })
      .populate('barberId', 'name specializations')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Group by barber
    const queuesByBarber = {};
    queues.forEach((q) => {
      if (!queuesByBarber[q.barberId._id]) {
        queuesByBarber[q.barberId._id] = {
          barberId: q.barberId._id,
          barberName: q.barberId.name,
          waiting: [],
          inProgress: [],
          completed: []
        };
      }

      if (q.status === 'waiting') {
        queuesByBarber[q.barberId._id].waiting.push(q);
      } else if (q.status === 'in-progress') {
        queuesByBarber[q.barberId._id].inProgress.push(q);
      } else if (q.status === 'done') {
        queuesByBarber[q.barberId._id].completed.push(q);
      }
    });

    res.json({
      salon: {
        id: salon._id,
        name: salon.name
      },
      queuesByBarber: Object.values(queuesByBarber)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get salon statistics (owner only)
export const getSalonStats = async (req, res) => {
  try {
    const salon = req.salon; // Set by middleware

    // ✅ STRICT AUTH: Already verified by verifySalonOwnerAccess middleware

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalServedToday = await Queue.countDocuments({
      salonId: salon._id,
      status: 'done',
      updatedAt: { $gte: today }
    });

    const totalCustomersToday = await Queue.countDocuments({
      salonId: salon._id,
      createdAt: { $gte: today }
    });

    const activeQueues = await Queue.countDocuments({
      salonId: salon._id,
      status: { $in: ['waiting', 'in-progress'] }
    });

    // Barber stats
    const barbers = await BarberProfile.find({ salonId: salon._id });
    const barberCount = barbers.length;

    res.json({
      salon: {
        id: salon._id,
        name: salon.name
      },
      today: {
        totalServed: totalServedToday,
        totalCustomers: totalCustomersToday,
        activeQueues
      },
      barbers: barberCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
