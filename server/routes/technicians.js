const express = require('express');
const { body, validationResult } = require('express-validator');
// PrismaClient imported from utils/database
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const prisma = require('../utils/database');

// Get pending technician registrations
router.get('/registrations', authenticateToken, requirePermission('technicians:view'), async (req, res) => {
  try {
    const registrations = await prisma.technicianRegistration.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Get technician registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch technician registrations'
    });
  }
});

// Approve technician registration
router.post('/registrations/:id/approve', authenticateToken, requirePermission('technicians:create'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Approving technician registration:', id);
    
    // Get registration
    const registration = await prisma.technicianRegistration.findUnique({
      where: { id }
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    if (registration.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Registration already processed'
      });
    }

    console.log('📱 Registration found for phone:', registration.phone);

    // Generate random password for technician
    const bcrypt = require('bcryptjs');
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    console.log('🔑 Generated password for technician');
    
    // Check if technician already exists
    const existingTechnician = await prisma.technician.findFirst({
      where: {
        OR: [
          { phone: registration.phone },
          { whatsappJid: registration.whatsappJid || `${registration.phone}@s.whatsapp.net` }
        ]
      }
    });

    if (existingTechnician) {
      console.log('⚠️ Technician already exists with this phone number');
      return res.status(400).json({
        success: false,
        error: 'Technician already exists with this phone number'
      });
    }
    
    // Create technician
    const technician = await prisma.technician.create({
      data: {
        name: `${registration.firstName} ${registration.lastName || ''}`.trim(),
        phone: registration.phone,
        whatsappJid: registration.whatsappJid || `${registration.phone}@s.whatsapp.net`,
        isActive: true,
        isAdmin: false
      }
    });
    console.log('✅ Technician created:', technician.id);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: registration.phone },
          { phone: registration.phone }
        ]
      }
    });

    // Normalize phone for username
    let normalizedPhone = registration.phone;
    if (normalizedPhone) {
      normalizedPhone = normalizedPhone.toString().replace(/[^0-9]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '62' + normalizedPhone.substring(1);
      }
      if (!normalizedPhone.startsWith('62')) {
        normalizedPhone = '62' + normalizedPhone;
      }
    }
    
    let user;
    if (existingUser) {
      console.log('⚠️ User already exists, updating password');
      // Update existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: 'teknisi',
          isActive: true,
          phone: normalizedPhone,
          whatsappNumber: normalizedPhone
        }
      });
    } else {
      // Create user account for technician
      user = await prisma.user.create({
        data: {
          username: normalizedPhone, // Use normalized phone as username
          password: hashedPassword,
          name: technician.name,
          phone: normalizedPhone,
          whatsappNumber: normalizedPhone,
          role: 'teknisi',
          isActive: true
        }
      });
    }
    console.log('✅ User account created/updated:', user.id);

    // Update registration status
    await prisma.technicianRegistration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: req.user.userId
      }
    });

    // Send WhatsApp notification to technician using database notification system
    try {
      // Ensure phone number is properly formatted
      let phoneForNotif = registration.phone || registration.whatsappNumber;
      if (!phoneForNotif) {
        console.error('❌ No phone number found for notification');
      } else {
        // Normalize phone number
        phoneForNotif = phoneForNotif.toString().replace(/[^0-9]/g, '');
        if (phoneForNotif.startsWith('0')) {
          phoneForNotif = '62' + phoneForNotif.substring(1);
        }
        if (!phoneForNotif.startsWith('62')) {
          phoneForNotif = '62' + phoneForNotif;
        }
        
        const recipientJid = `${phoneForNotif}@s.whatsapp.net`;
        console.log('📱 Creating notification for:', recipientJid);
        console.log('🔑 Generated credentials - Username:', phoneForNotif, 'Password:', randomPassword);
        
        const message = `✅ *Selamat! Registrasi Anda Telah Disetujui*

Anda sekarang terdaftar sebagai teknisi di sistem kami.

*Informasi Login:*
📱 Username: ${phoneForNotif}
🔑 Password: ${randomPassword}

*URL Login:*
${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Silakan login dan ganti password Anda.

Terima kasih! 🙏`;

        // Create notification in database (will be processed by notification monitor)
        const notification = await prisma.notification.create({
          data: {
            type: 'WHATSAPP',
            recipient: recipientJid,
            message: message,
            status: 'PENDING'
          }
        });
        
        console.log('✅ Notification created for technician approval:', notification.id, '->', recipientJid);
        
        // Try direct send if WhatsApp is connected (non-blocking)
        try {
          if (global.whatsappSocket && global.whatsappSocket.user) {
            await global.whatsappSocket.sendMessage(recipientJid, { text: message });
            console.log('✅ Direct WhatsApp notification sent to:', phoneForNotif);
          } else {
            console.log('⚠️ WhatsApp not connected, notification queued for processing');
          }
        } catch (directError) {
          console.warn('Direct WA send failed (non-blocking):', directError.message);
        }
      }
    } catch (notifError) {
      console.error('❌ Exception in WhatsApp notification:', notifError);
      console.error('Stack trace:', notifError.stack);
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      data: technician,
      message: 'Teknisi berhasil diapprove dan notifikasi telah dikirim'
    });
  } catch (error) {
    console.error('Approve technician registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve registration'
    });
  }
});

// Reject technician registration
router.post('/registrations/:id/reject', authenticateToken, requirePermission('technicians:create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Update registration status
    await prisma.technicianRegistration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    res.json({
      success: true,
      message: 'Registration rejected'
    });
  } catch (error) {
    console.error('Reject technician registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject registration'
    });
  }
});

// Get all technicians
router.get('/', authenticateToken, requirePermission('technicians:view'), async (req, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      include: {
        jobAssignments: {
          include: {
            job: {
              select: { id: true, jobNumber: true, status: true, type: true }
            }
          },
          where: {
            job: {
              status: {
                in: ['ASSIGNED', 'IN_PROGRESS']
              }
            }
          }
        },
        _count: {
          select: {
            jobAssignments: {
              where: {
                job: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: {
        technicians
      }
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

// Get single technician
router.get('/:id', authenticateToken, requirePermission('technicians:view'), async (req, res) => {
  try {
    const technician = await prisma.technician.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            jobAssignments: {
              where: {
                job: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      }
    });

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json(technician);
  } catch (error) {
    console.error('Get technician error:', error);
    res.status(500).json({ error: 'Failed to fetch technician' });
  }
});

// Create new technician
router.post('/', authenticateToken, requirePermission('technicians:create'), [
  body('name').isLength({ min: 2 }).trim(),
  body('phone').isMobilePhone('id-ID').trim(),
  body('whatsappJid').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('isAvailable').optional().isBoolean(),
  body('isAdmin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, whatsappJid, isActive = true, isAvailable = true, isAdmin = false } = req.body;

    const technician = await prisma.technician.create({
      data: {
        name,
        phone,
        whatsappJid,
        isActive,
        isAvailable,
        isAdmin
      }
    });

    res.status(201).json({ 
      success: true,
      message: 'Technician created successfully', 
      data: { technician }
    });
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({ error: 'Failed to create technician' });
  }
});

// Toggle technician admin role
router.patch('/:id/admin-role', authenticateToken, requirePermission('technicians:edit'), async (req, res) => {
  try {
    const { isAdmin } = req.body;
    
    const technician = await prisma.technician.update({
      where: { id: req.params.id },
      data: { isAdmin }
    });

    res.json({ 
      success: true,
      message: 'Admin role updated successfully', 
      data: { technician }
    });
  } catch (error) {
    console.error('Toggle admin role error:', error);
    res.status(500).json({ error: 'Failed to update admin role' });
  }
});

// Update technician
router.put('/:id', authenticateToken, requirePermission('technicians:edit'), [
  body('name').isLength({ min: 2 }).trim().optional(),
  body('phone').isMobilePhone('id-ID').optional(),
  body('whatsappJid').optional().trim(),
  body('isActive').isBoolean().optional(),
  body('isAvailable').isBoolean().optional(),
  body('isAdmin').isBoolean().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, whatsappJid, isActive, isAvailable, isAdmin } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (whatsappJid !== undefined) updateData.whatsappJid = whatsappJid;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    const technician = await prisma.technician.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ 
      success: true,
      message: 'Technician updated successfully', 
      data: { technician }
    });
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({ error: 'Failed to update technician' });
  }
});

// Get technician job assignments
router.get('/:id/jobs', authenticateToken, requirePermission('technicians:view'), async (req, res) => {
  try {
    const jobAssignments = await prisma.jobTechnician.findMany({
      where: { technicianId: req.params.id },
      include: {
        job: {
          include: {
            customer: {
              select: { name: true, address: true }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Transform the data to match frontend expectations
    const transformedAssignments = jobAssignments.map(assignment => ({
      id: assignment.id,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
      job: {
        id: assignment.job.id,
        customerName: assignment.job.customer?.name || assignment.job.customerName,
        customerAddress: assignment.job.customer?.address || assignment.job.customerAddress,
        type: assignment.job.type,
        status: assignment.job.status,
        createdAt: assignment.job.createdAt
      }
    }));

    res.json(transformedAssignments);
  } catch (error) {
    console.error('Get technician jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch technician job assignments' });
  }
});

// Get available technicians for job assignment
router.get('/available/for-job', authenticateToken, async (req, res) => {
  try {
    const technicians = await prisma.technician.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      include: {
        jobAssignments: {
          where: {
            job: {
              status: {
                in: ['ASSIGNED', 'IN_PROGRESS']
              }
            }
          },
          include: {
            job: {
              select: { id: true, jobNumber: true, status: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ technicians });
  } catch (error) {
    console.error('Get available technicians error:', error);
    res.status(500).json({ error: 'Failed to fetch available technicians' });
  }
});

// Delete technician (soft delete by setting isActive to false)
router.delete('/:id', authenticateToken, requirePermission('technicians:delete'), async (req, res) => {
  try {
    const technicianId = req.params.id;
    
    // Check if technician exists
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId }
    });
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    // Check if technician has active jobs
    const activeJobs = await prisma.jobTechnician.count({
      where: {
        technicianId: technicianId,
        job: {
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        }
      }
    });

    if (activeJobs > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete technician with active jobs. Please reassign or complete jobs first.' 
      });
    }

    // Try to hard delete first
    try {
      // Delete related jobTechnician records first
      await prisma.jobTechnician.deleteMany({
        where: { technicianId: technicianId }
      });
      
      // Then delete the technician
      await prisma.technician.delete({
        where: { id: technicianId }
      });
      
      res.json({ 
        success: true,
        message: 'Technician deleted successfully' 
      });
    } catch (deleteError) {
      // If hard delete fails due to constraints, do soft delete
      console.log('Hard delete failed, performing soft delete:', deleteError.message);
      
      await prisma.technician.update({
        where: { id: technicianId },
        data: { 
          isActive: false,
          isAvailable: false,
          updatedAt: new Date()
        }
      });
      
      res.json({ 
        success: true,
        message: 'Technician deactivated successfully',
        softDelete: true
      });
    }
  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({ 
      error: 'Failed to delete technician',
      details: error.message 
    });
  }
});

module.exports = router;
