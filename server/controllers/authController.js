import User from "../models/user.js";
import Salon from "../models/Salon.js";
import BarberProfile from "../models/BarberProfile.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Signup with role selection
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['customer', 'barber', 'salonOwner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    let profileData = { user };

    // If barber, fetch barber profile
    if (user.role === 'barber') {
      const barber = await BarberProfile.findOne({ userId: user._id })
        .populate('salonId');
      profileData.barber = barber;
    }

    // If salonOwner, fetch owned salons
    if (user.role === 'salonOwner') {
      const salons = await Salon.find({ ownerId: user._id });
      profileData.salons = salons;
    }

    res.json(profileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register a new salon owner with their first salon
export const registerSalonOwner = async (req, res) => {
  try {
    const { name, email, password, salonName, salonLocation } = req.body;

    // Validate inputs - FIXED: accepting just salonLocation as string
    if (!name || !email || !password || !salonName || !salonLocation) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create owner user
    const owner = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'salonOwner'
    });

    // Create salon with default coordinates (these can be updated later with real geolocation)
    // Using default coordinates for Bangalore (28.6139° N, 77.2090° E)
    const salon = await Salon.create({
      name: salonName,
      address: salonLocation,
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // [longitude, latitude]
      },
      ownerId: owner._id
    });

    // Create JWT token
    const token = jwt.sign(
      { id: owner._id, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Salon owner registered successfully',
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role
      },
      salon: {
        id: salon._id,
        name: salon.name,
        address: salon.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a barber to a salon (salon owner only)
export const addBarberToSalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { name, email, password, experience, specializations, basePrice, bio, profileImage } = req.body;
    const ownerId = req.user.id;

    // Verify salon ownership (already done by middleware, but double-check)
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== ownerId) {
      return res.status(403).json({ message: 'Not authorized: You can only add barbers to your own salon' });
    }

    // Check if barber email exists
    const existingBarber = await User.findOne({ email });
    if (existingBarber) {
      return res.status(400).json({ message: 'Barber email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create barber user
    const barber = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'barber'
    });

    // Create barber profile
    const barberProfile = await BarberProfile.create({
      userId: barber._id,
      salonId,
      name,
      experience: experience || 0,
      specializations: specializations || [],
      basePrice: basePrice || 50,
      bio: bio || '',
      profileImage: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
    });

    res.status(201).json({
      message: 'Barber added to salon successfully',
      barber: {
        id: barber._id,
        name: barber.name,
        email: barber.email,
        role: barber.role
      },
      barberProfile: barberProfile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all barbers (optionally filtered by salon)
export const getBarbers = async (req, res) => {
  try {
    const { salonId } = req.query;

    let query = { isActive: true };
    if (salonId) {
      query.salonId = salonId;
    }

    const barbers = await BarberProfile.find(query)
      .populate('userId', 'name email')
      .populate('salonId', 'name address');

    res.json(barbers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Get all available salons (for barbers to browse and join)
export const getAvailableSalons = async (req, res) => {
  try {
    const salons = await Salon.find({})
      .populate('ownerId', 'name email')
      .select('_id name address image description openingTime closingTime rating reviewCount ownerId');

    res.json(salons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Barber joins a salon (creates BarberProfile)
export const joinSalon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId, experience = 0, specializations = [], basePrice = 150, bio = '' } = req.body;

    // Validate inputs
    if (!salonId) {
      return res.status(400).json({ message: 'Salon ID is required' });
    }

    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Check if user is a barber
    const user = await User.findById(userId);
    if (user.role !== 'barber') {
      return res.status(403).json({ message: 'Only barbers can join salons' });
    }

    // Check if barber already has a profile
    const existingProfile = await BarberProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Barber profile already exists. Cannot join another salon.' });
    }

    // Create barber profile
    const barberProfile = await BarberProfile.create({
      userId,
      salonId,
      name: user.name,
      experience,
      specializations,
      basePrice,
      bio,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    });

    res.status(201).json({
      message: 'Successfully joined salon',
      barberProfile: {
        id: barberProfile._id,
        userId: barberProfile.userId,
        salonId: barberProfile.salonId,
        name: barberProfile.name,
        experience: barberProfile.experience,
        specializations: barberProfile.specializations,
        basePrice: barberProfile.basePrice,
        bio: barberProfile.bio
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
