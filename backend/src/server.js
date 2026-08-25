import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { checkPgConnection } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSocketIo } from './services/notificationService.js';
import { initializeSockets } from './sockets/socketHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import exploreRoutes from './routes/exploreRoutes.js';
import adminRoutes, { reportRouter } from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

setSocketIo(io);
initializeSockets(io);

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    name: 'VYBE Social API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRouter);
app.use('/api/upload', uploadRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Server startup
async function startServer() {
  await checkPgConnection();
  const PORT = env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🟣 ==========================================`);
    console.log(`🌐 VYBE API & Socket.IO Server running on port ${PORT}`);
    console.log(`⚡ Environment: ${env.NODE_ENV}`);
    console.log(`🟣 ==========================================\n`);
  });
}

startServer();

export { app, server, io };
