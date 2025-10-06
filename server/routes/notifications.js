const express = require('express');
const router = express.Router();
// PrismaClient imported from utils/database
const { authenticateToken } = require('../middleware/auth');

const prisma = require('../utils/database');

// Get notification counts for sidebar badges
router.get('/counts', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    console.log(`Fetching notification counts for role: ${role}`);

    let counts = {
      pending_approvals: 0,
      active_jobs: 0,
      pending_registrations: 0,
      low_stock: 0
    };

    console.log('Starting notification count queries...');

    // Only fetch counts based on user role permissions
    if (role === 'superadmin' || role === 'admin') {
      // Pending customer approvals - check all possible status values
      const pendingCustomers = await prisma.customer.count({
        where: {
          OR: [
            { registrationStatus: 'PENDING' },
            { registrationStatus: 'pending' },
            { registrationStatus: 'Pending' }
          ]
        }
      });
      counts.pending_approvals = pendingCustomers;
      console.log('Pending customers count:', pendingCustomers);

      // Active jobs (pending, assigned, or in progress)
      const activeJobs = await prisma.job.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'pending', 'assigned', 'in_progress']
          }
        }
      });
      counts.active_jobs = activeJobs;
      console.log('Active jobs count:', activeJobs);

      // Pending technician registrations
      const pendingRegistrations = await prisma.technicianRegistration.count({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'pending' },
            { status: 'Pending' }
          ]
        }
      });
      counts.pending_registrations = pendingRegistrations;
      console.log('Pending registrations count:', pendingRegistrations);
    }

    // Low stock items (for admin, superadmin, and gudang roles)
    if (role === 'superadmin' || role === 'admin' || role === 'gudang') {
      const lowStockItems = await prisma.item.count({
        where: {
          currentStock: {
            lte: 10 // Consider items with 10 or less as low stock
          }
        }
      });
      counts.low_stock = lowStockItems;
      console.log('Low stock items count:', lowStockItems);
    }

    // For teknisi, only show active jobs they can see
    if (role === 'teknisi' || role === 'technician') {
      const activeJobs = await prisma.job.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'pending', 'assigned', 'in_progress']
          }
        }
      });
      counts.active_jobs = activeJobs;
      console.log('Active jobs count for user/technician:', activeJobs);
    }

    console.log(`Notification counts for ${role}:`, counts);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification counts',
      details: error.message 
    });
  }
});

// Get pending notifications
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    
    // Only admin and superadmin can view notifications
    if (role !== 'superadmin' && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const notifications = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        type: 'WHATSAPP'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending notifications',
      details: error.message 
    });
  }
});

// Retry notification
router.post('/retry/:id', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    
    // Only admin and superadmin can retry notifications
    if (role !== 'superadmin' && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const notificationMonitor = require('../services/notificationMonitor');
    const result = await notificationMonitor.retryNotification(req.params.id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error retrying notification:', error);
    res.status(500).json({ 
      error: 'Failed to retry notification',
      details: error.message 
    });
  }
});

// Get notification stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    
    // Only admin and superadmin can view stats
    if (role !== 'superadmin' && role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const notificationMonitor = require('../services/notificationMonitor');
    const stats = await notificationMonitor.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification stats',
      details: error.message 
    });
  }
});

module.exports = router;
