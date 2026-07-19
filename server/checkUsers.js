import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;
const User = mongoose.model(
  'User',
  new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    createdAt: Date
  })
);

const Salon = mongoose.model(
  'Salon',
  new mongoose.Schema({
    name: String,
    ownerId: mongoose.Schema.Types.ObjectId,
    createdAt: Date
  })
);

async function checkUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'salonOwner' });
    console.log('\n=== SALON OWNER USERS ===');
    users.forEach(u => {
      console.log(`ID: ${u._id}`);
      console.log(`Name: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log('---');
    });

    const salons = await Salon.find();
    console.log('\n=== SALONS ===');
    salons.forEach(s => {
      console.log(`ID: ${s._id}`);
      console.log(`Name: ${s.name}`);
      console.log(`Owner ID: ${s.ownerId}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
