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
