import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Salon from './models/Salon.js';
import BarberProfile from './models/BarberProfile.js';
import Service from './models/Service.js';
import User from './models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Salon.deleteMany({});
    await BarberProfile.deleteMany({});
    await Service.deleteMany({});
    console.log('Cleared existing data');

    // Create salons
    const salons = await Salon.create([
      {
        name: 'Prime Cuts Salon',
        address: '123 Main St, Downtown',
        location: {
          type: 'Point',
          coordinates: [72.8479, 19.0176], // Mumbai
        },
        rating: 4.8,
        reviewCount: 324,
        image: 'https://images.unsplash.com/photo-1599662150142-3c5dbe2b1a25?w=400&h=300&fit=crop',
        description: 'Premium haircut and grooming salon',
        openingTime: '09:00',
        closingTime: '21:00',
      },
      {
        name: 'Urban Barber Studio',
        address: '456 Park Avenue, Midtown',
        location: {
          type: 'Point',
          coordinates: [72.8563, 19.0760], // Mumbai
        },
        rating: 4.6,
        reviewCount: 287,
        image: 'https://images.unsplash.com/photo-1622286346637-66c860479dfa?w=400&h=300&fit=crop',
        description: 'Modern barbering experience',
        openingTime: '10:00',
        closingTime: '22:00',
      },
      {
        name: 'The Grooming Hub',
        address: '789 High Street, Uptown',
        location: {
          type: 'Point',
          coordinates: [72.8345, 19.1136], // Mumbai
        },
        rating: 4.7,
        reviewCount: 456,
        image: 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=400&h=300&fit=crop',
        description: 'Full grooming and styling services',
        openingTime: '08:00',
        closingTime: '20:00',
      },
    ]);
    console.log(`Created ${salons.length} salons`);

    // Find or create barber users
    let barberUsers = await User.find({ role: 'barber' });
    if (barberUsers.length < 3) {
      const newBarbers = await User.create([
        {
          name: 'Raj Sharma',
          email: 'raj@barber.com',
          password: 'password123',
          role: 'barber',
        },
        {
          name: 'Arjun Patel',
          email: 'arjun@barber.com',
          password: 'password123',
          role: 'barber',
        },
        {
          name: 'Vikram Singh',
          email: 'vikram@barber.com',
          password: 'password123',
          role: 'barber',
        },
      ]);
      barberUsers = newBarbers;
    }

    // Create barber profiles
    const barberProfiles = await BarberProfile.create([
      {
        userId: barberUsers[0]._id,
        salonId: salons[0]._id,
        name: 'Raj Sharma',
        experience: 8,
        specializations: ['Fade', 'Undercut', 'Beard Trim'],
        rating: 4.9,
        reviewCount: 289,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        basePrice: 150,
        bio: 'Expert in modern haircuts and beard styling',
      },
      {
        userId: barberUsers[1]._id,
        salonId: salons[1]._id,
        name: 'Arjun Patel',
        experience: 6,
        specializations: ['Fade', 'Taper', 'Hair Design'],
        rating: 4.7,
        reviewCount: 210,
        profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
        basePrice: 120,
        bio: 'Creative cutting styles and precision work',
      },
      {
        userId: barberUsers[2]._id,
        salonId: salons[0]._id,
        name: 'Vikram Singh',
        experience: 10,
        specializations: ['Fade', 'Undercut', 'Beard Trim', 'Color'],
        rating: 4.8,
        reviewCount: 412,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        basePrice: 200,
        bio: 'Master barber with premium styling expertise',
      },
    ]);
    console.log(`Created ${barberProfiles.length} barber profiles`);

    // Create services
    const services = await Service.create([
      // Raj Sharma services
      {
        barberId: barberProfiles[0]._id,
        name: 'Basic Haircut',
        description: 'Standard haircut with clipper and scissors',
        price: 150,
        duration: 20,
      },
      {
        barberId: barberProfiles[0]._id,
        name: 'Fade + Line Design',
        description: 'Classic fade with precision line design',
        price: 250,
        duration: 30,
      },
      {
        barberId: barberProfiles[0]._id,
        name: 'Beard Trim + Shape',
        description: 'Professional beard trimming and shaping',
        price: 120,
        duration: 20,
      },
      {
        barberId: barberProfiles[0]._id,
        name: 'Full Grooming Package',
        description: 'Haircut, beard trim, and facial',
        price: 400,
        duration: 60,
      },
      // Arjun Patel services
      {
        barberId: barberProfiles[1]._id,
        name: 'Premium Haircut',
        description: 'Expert cutting with premium consultation',
        price: 120,
        duration: 25,
      },
      {
        barberId: barberProfiles[1]._id,
        name: 'Taper Fade',
        description: 'Smooth taper fade with blending',
        price: 200,
        duration: 25,
      },
      {
        barberId: barberProfiles[1]._id,
        name: 'Hair Design',
        description: 'Custom hair design and patterns',
        price: 300,
        duration: 40,
      },
      // Vikram Singh services
      {
        barberId: barberProfiles[2]._id,
        name: 'Master Haircut',
        description: 'Premium haircut with master barber',
        price: 200,
        duration: 30,
      },
      {
        barberId: barberProfiles[2]._id,
        name: 'Luxury Fade',
        description: 'Premium fade with artistic finishing',
        price: 350,
        duration: 35,
      },
      {
        barberId: barberProfiles[2]._id,
        name: 'Beard Coloring',
        description: 'Professional beard coloring service',
        price: 150,
        duration: 25,
      },
      {
        barberId: barberProfiles[2]._id,
        name: 'Complete Makeover',
        description: 'Full service makeover including styling',
        price: 600,
        duration: 90,
      },
    ]);
    console.log(`Created ${services.length} services`);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
