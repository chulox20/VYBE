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

// Global error handlers
process.on('uncaughtException', (err) => {
  console.warn('⚠️ [Server Caught Exception]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ [Server Caught Rejection]:', reason);
});

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

// CORS Origins configuration
const allowedOrigins = env.NODE_ENV === 'production'
  ? [env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', env.FRONTEND_URL].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Acceso no permitido por la política CORS de VYBE.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.io configuration with strict CORS
const io = new Server(server, {
  cors: corsOptions,
});

setSocketIo(io);
initializeSockets(io);

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
});
app.use('/api', apiLimiter);

// Strict Rate Limiter for Auth (Login & Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 minutes
  message: { success: false, error: 'Demasiados intentos de autenticación. Por favor espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Strict Rate Limiter for Post Creation
const postCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, error: 'Has alcanzado el límite de publicaciones por el momento. Intenta más tarde.' },
});
app.use('/api/posts', (req, res, next) => {
  if (req.method === 'POST') {
    return postCreationLimiter(req, res, next);
  }
  next();
});

// Strict Rate Limiter for Direct Messaging
const messageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 80,
  message: { success: false, error: 'Has enviado demasiados mensajes rápidamente. Por favor espera un momento.' },
});
app.use('/api/messages/send', messageLimiter);

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

  setInterval(() => {}, 1000 * 60 * 60);
}

startServer();

export { app, server, io };
