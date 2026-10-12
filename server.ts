
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

// Controllers with socket setters
import { setProjectSocketIO } from './server/controllers/projectController.js';
import { setTaskSocketIO } from './server/controllers/taskController.js';
import { setCommentSocketIO } from './server/controllers/commentController.js';

// Socket handler
import { setupSocketHandler } from './server/sockets/socketHandler.js';

// Route modules
import authRoutes from './server/routes/authRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import projectRoutes from './server/routes/projectRoutes.js';
import taskRoutes from './server/routes/taskRoutes.js';
import commentRoutes from './server/routes/commentRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import activityRoutes from './server/routes/activityRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import { errorHandler } from './server/middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Allow requests from the deployed Vercel frontend
const allowedOrigins = [
  'https://collabflow-gkbb.vercel.app',
  'https://collabflow-gkbb-iu2lszhix-katakambhavyasree-6395.vercel.app',
];

// CORS for Express API requests
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

setProjectSocketIO(io);
setTaskSocketIO(io);
setCommentSocketIO(io);
setupSocketHandler(io);

// Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check / API status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CollabFlow API',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dashboardRoutes); // For /api/search

// API Error Handler
app.use('/api', errorHandler);

// Mount Vite or serve static files
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[CollabFlow] Server running on http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error('[CollabFlow] Fatal startup error:', err);
  process.exit(1);
});
