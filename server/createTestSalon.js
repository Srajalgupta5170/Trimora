import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;

const salonSchema = new mongoose.Schema({
  name: String,
  address: String,
  location: { type: String },
  rating: Number,
  image: String,
  gallery: Array,
  description: String,
  hours: String,
  ownerId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const Salon = mongoose.model('Salon', salonSchema);

async function createTestSalon() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const ownerId = '6a1ec9425f40c7fcb20dd2b8'; // The test owner ID

    const salon = await Salon.create({
      name: 'Test Trimora Salon',
      address: '123 Main Street',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // [longitude, latitude] - New Delhi
      },
      rating: 4.8,
      image: 'https://via.placeholder.com/400x300?text=Test+Salon',
      gallery: [],
      description: 'A beautiful test salon for trying out the media upload feature',
      ownerId: new mongoose.Types.ObjectId(ownerId)
    });

    console.log('✅ Test salon created:');
    console.log(`Salon ID: ${salon._id}`);
    console.log(`Name: ${salon.name}`);
    console.log(`Owner ID: ${salon.ownerId}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestSalon();
