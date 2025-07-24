#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

// Load environment variables
dotenv.config();

// Import route handlers
import { senseHandler } from './sense.js';
import { proposeHandler } from './propose.js';
import { adoptHandler } from './adopt.js';
import { initIPFS } from './lib/ipfs.js';

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0-alpha',
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EGP Node',
    description: 'Reference implementation of the Emergent Governance Protocol',
    version: process.env.npm_package_version || '0.1.0-alpha',
    endpoints: {
      sense: 'POST /sense',
      propose: 'POST /propose', 
      adopt: 'POST /adopt'
    },
    documentation: 'https://globalgovernanceframeworks.org/frameworks/emergent-governance-protocol',
    source: 'https://github.com/ggf/egp'
  });
});

// EGP Protocol endpoints
app.post('/sense', senseHandler);
app.post('/propose', proposeHandler);
app.post('/adopt', adoptHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: ['GET /', 'GET /health', 'POST /sense', 'POST /propose', 'POST /adopt']
  });
});

// Initialize IPFS and start server
async function startServer() {
  try {
    logger.info('Initializing IPFS connection...');
    await initIPFS();
    logger.info('IPFS connection established');

    app.listen(PORT, () => {
      logger.info(`🌱 EGP Node running on port ${PORT}`);
      logger.info(`📡 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API info: http://localhost:${PORT}/`);
      logger.info('🔍 Ready to receive sense() signals');
      logger.info('💡 Ready to receive propose() solutions');
      logger.info('⚡ Ready to receive adopt() commitments');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
