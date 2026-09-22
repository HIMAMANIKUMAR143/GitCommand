import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import repositoryRoutes from './routes/repositoryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDbPool, isUsingInMemoryDb } from './database/db.js';
import { seedDemoData } from './database/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow local and remote frontend clients
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint (supports both /api/health and /health)
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Git Reset Lab API',
    database_mode: isUsingInMemoryDb() ? 'in-memory-postgresql' : 'live-postgresql',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Root API endpoints
const rootHandler = (req, res) => {
  res.json({
    status: 'online',
    service: 'Git Reset Lab API',
    version: '1.0.0'
  });
};
app.get('/api', rootHandler);
app.get('/', rootHandler);

// Mount Routes (supports both /api/repositories and /repositories)
app.use('/api/repositories', repositoryRoutes);
app.use('/repositories', repositoryRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use(errorHandler);

// Startup & Bootstrap for standalone/local server
async function startServer() {
  try {
    await getDbPool();
    await seedDemoData();

    // Only listen on port if not in test and not in Vercel serverless environment
    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Git Reset Lab Backend running at http://localhost:${PORT}`);
        console.log(`📦 Database Mode: ${isUsingInMemoryDb() ? 'In-Memory PostgreSQL Engine' : 'Live PostgreSQL Server'}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start Git Reset Lab backend:', err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// In local environment, start server immediately
if (!process.env.VERCEL) {
  startServer();
}

export default app;
