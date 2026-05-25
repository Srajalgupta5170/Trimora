import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import connectDB from './config/db.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with absolute path to server/.env
const result = dotenv.config({ path: path.join(__dirname, '.env') });
if (result.error) {
  console.warn('Warning: Could not load .env file:', result.error.message);
}

// Explicitly set fallback values if env variables not loaded
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb+srv://srajalgupta5170_db_user:VsvB54HLGecySZNN@cluster0.b78eukr.mongodb.net/?appName=Cluster0';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'mysecret123';
}
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

console.log('Env Config:', {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'Set (hidden)' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
});

import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import barberRequestRoutes from './routes/barberRequestRoutes.js';
import earningsRoutes from './routes/earningsRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import barberProfileRoutes from './routes/barberProfileRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import salonMediaRoutes from './routes/salonMediaRoutes.js';
import joinRequestRoutes from './routes/joinRequestRoutes.js';

import { protect, authorizeRoles } from './middlewares/roleMiddleware.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/barber-requests', barberRequestRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/barber', barberProfileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/salon', salonMediaRoutes);
app.use('/api/join-requests', joinRequestRoutes);

// Static files for uploads
app.use('/uploads', express.static('public/uploads'));

// Test route
app.get('/', (req, res) => {
  res.send('🎯 Barber Queue API is running...');
});

// Protected routes
app.get('/api/protected', protect, (req, res) => {
  res.json({
    message: 'You are authorized',
    user: req.user
  });
});

app.get('/api/barber-only', protect, authorizeRoles('barber'), (req, res) => {
  res.json({ message: 'Welcome Barber' });
});

// ==================== SOCKET.IO SETUP ====================
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Make io accessible in controllers
// ===== ERROR HANDLING MIDDLEWARE =====
// Handle multer errors
import util from 'util';

app.use((err, req, res, next) => {
  if (!err) return next();
  // Multer errors
  if (err.name === 'MulterError') {
    console.error('❌ Multer Error:', util.inspect(err, { depth: 4 }));
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Log any error object or value
  console.error('❌ Server Error (raw):', util.inspect(err, { depth: 6 }));
  const message = (err && err.message) ? err.message : JSON.stringify(err);
  console.error('Stack:', err && err.stack ? err.stack : 'no stack');
  res.status(500).json({ error: message || 'Internal server error' });
});

app.set('io', io);

// ===== SOCKET CONNECTION & ROOM MANAGEMENT =====
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // ===== BARBER JOINS THEIR ROOM =====
  // Client calls: socket.emit('joinBarberRoom', { barberId })
  socket.on('joinBarberRoom', ({ barberId }) => {
    const roomName = `barber_${barberId}`;
    socket.join(roomName);
    console.log(`✅ Socket ${socket.id} joined room: ${roomName}`);
    
    // Notify barber that they're subscribed
    socket.emit('roomJoined', { room: roomName });
  });

  // ===== CUSTOMER JOINS THEIR USER ROOM (FOR NOTIFICATIONS) =====
  // Client calls: socket.emit('joinUserRoom', { userId })
  socket.on('joinUserRoom', ({ userId }) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`✅ Socket ${socket.id} joined user room: ${roomName}`);
    
    socket.emit('userRoomJoined', { room: roomName });
  });

  // ===== CUSTOMER JOINS QUEUE ROOM (TO WATCH POSITION) =====
  // Client calls: socket.emit('watchBarbeQueue', { barberId })
  socket.on('watchBarberQueue', ({ barberId }) => {
    const roomName = `barber_queue_${barberId}`;
    socket.join(roomName);
    console.log(`✅ Socket ${socket.id} joined queue room: ${roomName}`);
    
    socket.emit('queueRoomJoined', { room: roomName });
  });

  // ===== LEAVE USER ROOM =====
  socket.on('leaveUserRoom', ({ userId }) => {
    const roomName = `user_${userId}`;
    socket.leave(roomName);
    console.log(`✅ Socket ${socket.id} left user room: ${roomName}`);
  });

  // ===== LEAVE BARBER ROOM =====
  socket.on('leaveBarberRoom', ({ barberId }) => {
    const roomName = `barber_${barberId}`;
    socket.leave(roomName);
    console.log(`✅ Socket ${socket.id} left room: ${roomName}`);
  });

  // ===== LEAVE QUEUE ROOM =====
  socket.on('leaveQueueRoom', ({ barberId }) => {
    const roomName = `barber_queue_${barberId}`;
    socket.leave(roomName);
    console.log(`✅ Socket ${socket.id} left queue room: ${roomName}`);
  });

  // ===== DISCONNECT =====
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ===== ERROR HANDLING =====
io.on('error', (error) => {
  console.error('Socket.IO error:', error);
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  🚀 SERVER RUNNING                     ║
  ║  Port: ${PORT}                            ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║  Socket.IO: Enabled                    ║
  ║  Auth: JWT                             ║
  ║  Database: MongoDB                     ║
  ╚════════════════════════════════════════╝
  `);
});

export default io;