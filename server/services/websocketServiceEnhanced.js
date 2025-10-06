const { Server } = require('socket.io');
const logger = require('../utils/logger');
const prisma = require('../utils/database');
const jwt = require('jsonwebtoken');

let io = null;

// Enhanced rate limiting with per-socket tracking
const rateLimitMap = new Map();
const messageRateLimitMap = new Map();
const CONNECTION_WINDOW = 60000; // 1 minute
const MAX_CONNECTIONS_PER_IP = 5;
const MAX_MESSAGES_PER_MINUTE = 100;
const MESSAGE_SIZE_LIMIT = 1048576; // 1MB

// Metrics tracking
const metrics = {
  totalConnections: 0,
  activeConnections: 0,
  totalMessages: 0,
  errors: 0,
  rooms: new Map(),
  latencies: [],
  getAverageLatency() {
    if (this.latencies.length === 0) return 0;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  },
  addLatency(ms) {
    this.latencies.push(ms);
    // Keep only last 100 latencies
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }
  }
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > CONNECTION_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }
  for (const [key, value] of messageRateLimitMap.entries()) {
    if (now - value.resetTime > 60000) {
      messageRateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Initialize WebSocket server with enhanced configuration
const initializeWebSocket = (server) => {
  const corsOrigin = process.env.CLIENT_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000');

  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true
    },
    // Enhanced connection settings
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: MESSAGE_SIZE_LIMIT,
    allowUpgrades: true,
    transports: ['websocket', 'polling'],
    // Enable compression for messages > 1KB
    perMessageDeflate: {
      threshold: 1024,
      zlibDeflateOptions: {
        level: 6,
        memLevel: 8,
        strategy: 0
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      }
    }
  });

  // Connection-level rate limiting middleware
  io.use((socket, next) => {
    const clientIP = socket.handshake.address;
    const now = Date.now();
    
    if (rateLimitMap.has(clientIP)) {
      const limit = rateLimitMap.get(clientIP);
      
      if (now - limit.timestamp < CONNECTION_WINDOW) {
        if (limit.count >= MAX_CONNECTIONS_PER_IP) {
          logger.warn('Connection rate limit exceeded', { 
            clientIP, 
            attempts: limit.count 
          });
          return next(new Error('Too many connection attempts. Please wait.'));
        }
        limit.count++;
      } else {
        // Reset window
        limit.count = 1;
        limit.timestamp = now;
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    }
    
    next();
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                   socket.handshake.query?.token || 
                   socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      socket.data.permissions = decoded.permissions || [];
      
      next();
    } catch (error) {
      logger.warn('WebSocket authentication failed', { 
        error: error.message,
        socketId: socket.id 
      });
      next(new Error('Invalid or expired token'));
    }
  });

  // Main connection handler
  io.on('connection', (socket) => {
    const { userId, role } = socket.data;
    const clientIP = socket.handshake.address;
    
    // Update metrics
    metrics.totalConnections++;
    metrics.activeConnections++;
    
    logger.info('WebSocket client connected', { 
      socketId: socket.id,
      userId,
      role,
      clientIP,
      activeConnections: metrics.activeConnections
    });

    // Initialize message rate limiting for this socket
    messageRateLimitMap.set(socket.id, {
      count: 0,
      resetTime: Date.now() + 60000
    });

    // Error boundary for all socket events
    socket.use(([event, ...args], next) => {
      const now = Date.now();
      const rateLimit = messageRateLimitMap.get(socket.id);
      
      // Check message rate limit
      if (rateLimit) {
        if (now > rateLimit.resetTime) {
          rateLimit.count = 1;
          rateLimit.resetTime = now + 60000;
        } else {
          rateLimit.count++;
          if (rateLimit.count > MAX_MESSAGES_PER_MINUTE) {
            logger.warn('Message rate limit exceeded', {
              socketId: socket.id,
              userId,
              event
            });
            socket.emit('error', { 
              message: 'Rate limit exceeded. Please slow down.' 
            });
            return;
          }
        }
      }

      // Check message size
      const messageSize = JSON.stringify(args).length;
      if (messageSize > MESSAGE_SIZE_LIMIT) {
        logger.warn('Message size limit exceeded', {
          socketId: socket.id,
          userId,
          event,
          size: messageSize
        });
        socket.emit('error', { 
          message: 'Message too large' 
        });
        return;
      }

      // Wrap in try-catch for error handling
      try {
        metrics.totalMessages++;
        next();
      } catch (error) {
        metrics.errors++;
        logger.error(`Error in socket event ${event}`, {
          error: error.message,
          socketId: socket.id,
          userId
        });
        socket.emit('error', { 
          message: 'Internal server error' 
        });
      }
    });

    // Auto-join rooms based on user role
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    
    // Track room metrics
    metrics.rooms.set(`user-${userId}`, 
      (metrics.rooms.get(`user-${userId}`) || 0) + 1
    );
    metrics.rooms.set(`role-${role}`, 
      (metrics.rooms.get(`role-${role}`) || 0) + 1
    );

    // Enhanced room joining with validation
    socket.on('join-room', (data) => {
      try {
        const { roomType, roomId } = data;
        
        // Validate room access based on user role
        if (roomType === 'customer' && role !== 'customer') {
          socket.join(`customer-${roomId}`);
          logger.info('User joined customer room', { 
            userId, 
            roomId, 
            socketId: socket.id 
          });
        } else if (roomType === 'teknisi' && 
                  (role === 'teknisi' || role === 'technician' || role === 'admin')) {
          socket.join(`teknisi-${roomId}`);
          logger.info('User joined technician room', { 
            userId, 
            roomId, 
            socketId: socket.id 
          });
        }
      } catch (error) {
        logger.error('Error joining room', {
          error: error.message,
          socketId: socket.id,
          userId
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Ping-pong for latency measurement
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    // Client latency reporting
    socket.on('report-latency', (latency) => {
      if (typeof latency === 'number' && latency > 0 && latency < 10000) {
        metrics.addLatency(latency);
      }
    });

    // Handle graceful disconnect
    socket.on('disconnect', (reason) => {
      metrics.activeConnections--;
      
      // Clean up rate limit entry
      messageRateLimitMap.delete(socket.id);
      
      // Update room metrics
      if (metrics.rooms.has(`user-${userId}`)) {
        const count = metrics.rooms.get(`user-${userId}`) - 1;
        if (count <= 0) {
          metrics.rooms.delete(`user-${userId}`);
        } else {
          metrics.rooms.set(`user-${userId}`, count);
        }
      }
      
      logger.info('WebSocket client disconnected', { 
        socketId: socket.id,
        userId,
        reason,
        activeConnections: metrics.activeConnections
      });
    });

    // Connection error handling
    socket.on('error', (error) => {
      metrics.errors++;
      logger.error('Socket error', {
        error: error.message,
        socketId: socket.id,
        userId
      });
    });
  });

  // Handle server-level errors
  io.on('error', (error) => {
    logger.error('WebSocket server error', { error: error.message });
  });

  logger.info('WebSocket server initialized', {
    cors: corsOrigin,
    transports: ['websocket', 'polling'],
    compression: true
  });

  return io;
};

// Emit events with error handling
const emitToUser = (userId, event, data) => {
  try {
    if (io) {
      io.to(`user-${userId}`).emit(event, data);
      logger.debug('Emitted to user', { userId, event });
    }
  } catch (error) {
    logger.error('Error emitting to user', {
      error: error.message,
      userId,
      event
    });
  }
};

const emitToRole = (role, event, data) => {
  try {
    if (io) {
      io.to(`role-${role}`).emit(event, data);
      logger.debug('Emitted to role', { role, event });
    }
  } catch (error) {
    logger.error('Error emitting to role', {
      error: error.message,
      role,
      event
    });
  }
};

const emitToCustomer = (customerId, event, data) => {
  try {
    if (io) {
      io.to(`customer-${customerId}`).emit(event, data);
      logger.debug('Emitted to customer', { customerId, event });
    }
  } catch (error) {
    logger.error('Error emitting to customer', {
      error: error.message,
      customerId,
      event
    });
  }
};

// Get metrics for monitoring
const getMetrics = () => {
  return {
    ...metrics,
    averageLatency: metrics.getAverageLatency(),
    roomCount: metrics.rooms.size,
    uptime: process.uptime()
  };
};

// Graceful shutdown
const shutdown = () => {
  if (io) {
    logger.info('Shutting down WebSocket server...');
    io.close(() => {
      logger.info('WebSocket server closed');
    });
  }
};

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToRole,
  emitToCustomer,
  getMetrics,
  shutdown,
  getIO: () => io
};
