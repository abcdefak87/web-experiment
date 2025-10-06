const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { getMetrics, getIO } = require('../services/websocketServiceEnhanced');
const logger = require('../utils/logger');

// Get WebSocket metrics (admin only)
router.get('/metrics', authenticateToken, requirePermission('admin'), (req, res) => {
  try {
    const metrics = getMetrics();
    const io = getIO();
    
    // Add additional server metrics
    const enhancedMetrics = {
      ...metrics,
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      connectedSockets: io ? io.sockets.sockets.size : 0,
      namespaces: io ? Object.keys(io._nsps).length : 0
    };
    
    res.json({
      success: true,
      data: enhancedMetrics
    });
  } catch (error) {
    logger.error('Error fetching WebSocket metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

// Get connected clients (admin only)
router.get('/clients', authenticateToken, requirePermission('admin'), (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.json({
        success: true,
        data: {
          clients: [],
          total: 0
        }
      });
    }
    
    const clients = [];
    for (const [socketId, socket] of io.sockets.sockets) {
      clients.push({
        socketId,
        userId: socket.data.userId,
        role: socket.data.role,
        rooms: Array.from(socket.rooms),
        connected: socket.connected,
        handshake: {
          address: socket.handshake.address,
          time: socket.handshake.time,
          headers: {
            userAgent: socket.handshake.headers['user-agent']
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        clients,
        total: clients.length
      }
    });
  } catch (error) {
    logger.error('Error fetching connected clients', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
});

// Get room information (admin only)
router.get('/rooms', authenticateToken, requirePermission('admin'), (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.json({
        success: true,
        data: {
          rooms: {},
          total: 0
        }
      });
    }
    
    const rooms = {};
    const allRooms = io.sockets.adapter.rooms;
    
    for (const [roomName, socketIds] of allRooms) {
      // Skip socket ID rooms (each socket automatically joins a room with its ID)
      if (!io.sockets.sockets.has(roomName)) {
        rooms[roomName] = {
          sockets: Array.from(socketIds),
          count: socketIds.size
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        rooms,
        total: Object.keys(rooms).length
      }
    });
  } catch (error) {
    logger.error('Error fetching room information', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rooms'
    });
  }
});

// Test WebSocket connection (admin only)
router.post('/test', authenticateToken, requirePermission('admin'), (req, res) => {
  try {
    const { userId, event, data } = req.body;
    const io = getIO();
    
    if (!io) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket server not initialized'
      });
    }
    
    // Send test message
    if (userId) {
      io.to(`user-${userId}`).emit(event || 'test', data || { 
        message: 'Test message from monitoring',
        timestamp: new Date().toISOString()
      });
    } else {
      io.emit(event || 'test', data || {
        message: 'Broadcast test message',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Test message sent',
      details: {
        userId,
        event: event || 'test',
        broadcast: !userId
      }
    });
  } catch (error) {
    logger.error('Error sending test WebSocket message', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to send test message'
    });
  }
});

// Force disconnect a client (admin only)
router.post('/disconnect/:socketId', authenticateToken, requirePermission('admin'), (req, res) => {
  try {
    const { socketId } = req.params;
    const io = getIO();
    
    if (!io) {
      return res.status(503).json({
        success: false,
        error: 'WebSocket server not initialized'
      });
    }
    
    const socket = io.sockets.sockets.get(socketId);
    
    if (!socket) {
      return res.status(404).json({
        success: false,
        error: 'Socket not found'
      });
    }
    
    socket.disconnect(true);
    
    logger.info('Force disconnected socket', { 
      socketId,
      adminId: req.user.id 
    });
    
    res.json({
      success: true,
      message: 'Socket disconnected successfully'
    });
  } catch (error) {
    logger.error('Error disconnecting socket', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect socket'
    });
  }
});

module.exports = router;
