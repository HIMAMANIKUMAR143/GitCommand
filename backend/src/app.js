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
  origin: '*', // Allow local frontend Vite dev server
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Git Reset Lab API',
    database_mode: isUsingInMemoryDb() ? 'in-memory-postgresql' : 'live-postgresql',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/repositories', repositoryRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use(errorHandler);

// Startup & Bootstrap
async function startServer() {
  try {
    await getDbPool();
    await seedDemoData();

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🚀 Git Reset Lab Backend running at http://localhost:${PORT}`);
        console.log(`📦 Database Mode: ${isUsingInMemoryDb() ? 'In-Memory PostgreSQL Engine' : 'Live PostgreSQL Server'}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start Git Reset Lab backend:', err);
    process.exit(1);
  }
}

startServer();

export default app;
