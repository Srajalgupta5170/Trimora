import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestOwner() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'testowner@trimora.com';
    const password = 'testowner123';

    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Test owner already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: 'Test Owner',
      email: email,
      password: hashedPassword,
      role: 'salonOwner'
    });

    console.log('✅ Test owner created:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`ID: ${user._id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestOwner();
