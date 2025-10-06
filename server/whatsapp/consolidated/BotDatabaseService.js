/**
 * Bot Database Service
 * Handles database operations for WhatsApp bot
 */

const prisma = require('../../utils/database');
const { normalizePhone, getWhatsAppJid } = require('../../utils/phoneUtils');

class BotDatabaseService {
  // Helper: normalize phone to 62 format
  // @deprecated Use phoneUtils.normalizePhone instead
  normalizePhone(phone) {
    return normalizePhone(phone);
  }

  // Check existing technician by phone/jid
  async checkExistingTechnician(phone) {
    try {
      const normalized = this.normalizePhone(phone);
      const technician = await prisma.technician.findFirst({
        where: {
          OR: [
            { phone: normalized },
            { whatsappJid: normalized ? normalized + '@s.whatsapp.net' : undefined }
          ]
        }
      });
      return !!technician;
    } catch (error) {
      console.error('Error checking existing technician:', error);
      return false;
    }
  }

  // Check TechnicianRegistration status by phone
  async getTechnicianRegistrationStatus(phone) {
    try {
      const normalized = this.normalizePhone(phone);
      const reg = await prisma.technicianRegistration.findFirst({
        where: { phone: normalized, status: 'PENDING' }
      });
      return reg;
    } catch (error) {
      console.error('Error getting technician registration status:', error);
      return null;
    }
  }

  // Create TechnicianRegistration entry
  async createTechnicianRegistration({ name, phone, whatsappJid }) {
    try {
      const normalized = this.normalizePhone(phone);
      const [firstName, ...rest] = (name || '').trim().split(' ').filter(Boolean);
      const lastName = rest.join(' ') || null;

      const reg = await prisma.technicianRegistration.create({
        data: {
          whatsappNumber: normalized,
          whatsappJid: whatsappJid || (normalized ? normalized + '@s.whatsapp.net' : null),
          firstName: firstName || (name || 'Teknisi'),
          lastName,
          phone: normalized,
          status: 'PENDING'
        }
      });
      return reg;
    } catch (error) {
      console.error('Error creating technician registration:', error);
      throw error;
    }
  }
  // Get technician by WhatsApp JID
  async getTechnicianByJid(jid) {
    try {
      return await prisma.technician.findUnique({
        where: { whatsappJid: jid }
      });
    } catch (error) {
      console.error('Error getting technician by JID:', error);
      return null;
    }
  }

  // Register new technician
  async registerTechnician(phoneNumber, name) {
    try {
      const normalized = this.normalizePhone(phoneNumber);
      const whatsappJid = normalized + '@s.whatsapp.net';
      
      // Check if already registered as technician
      const existing = await prisma.technician.findFirst({
        where: {
          OR: [
            { whatsappJid },
            { phone: normalized }
          ]
        }
      });

      if (existing) {
        return { success: false, message: 'Nomor ini sudah terdaftar sebagai teknisi!' };
      }

      // Check if already has pending registration
      const pendingReg = await prisma.technicianRegistration.findFirst({
        where: {
          phone: normalized,
          status: 'PENDING'
        }
      });

      if (pendingReg) {
        return { success: false, message: 'Registrasi Anda sedang menunggu persetujuan admin!' };
      }

      // Create pending registration instead of direct technician
      await this.createTechnicianRegistration({
        name: name,
        phone: normalized,
        whatsappJid: whatsappJid
      });

      return { 
        success: true, 
        message: 'Registrasi berhasil dikirim! Menunggu persetujuan admin.' 
      };
    } catch (error) {
      console.error('Error registering technician:', error);
      return { success: false, message: 'Gagal mendaftar: ' + error.message };
    }
  }

  // Get available jobs
  async getAvailableJobs() {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          status: {
            in: ['OPEN', 'ASSIGNED'] // Job yang bisa diambil (belum selesai)
          },
          technicians: {
            none: {} // Job yang belum ada teknisi
          }
        },
        include: {
          customer: true,
          technicians: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`🔍 getAvailableJobs: Found ${jobs.length} jobs`);
      jobs.forEach(job => {
        console.log(`  - ${job.jobNumber}: status=${job.status}, technicians=${job.technicians.length}`);
      });
      
      return jobs;
    } catch (error) {
      console.error('Error getting available jobs:', error);
      return [];
    }
  }

  // Get job by job number
  async getJobByNumber(jobNumber) {
    try {
      return await prisma.job.findFirst({
        where: {
          jobNumber: jobNumber
        },
        include: {
          customer: true,
          technicians: {
            include: {
              technician: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting job by number:', error);
      return null;
    }
  }

  // Get technician's assigned jobs
  async getTechnicianJobs(technicianId) {
    try {
      return await prisma.job.findMany({
        where: {
          technicians: {
            some: {
              technicianId: technicianId
            }
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        },
        include: {
          customer: true,
          technicians: {
            where: {
              technicianId: technicianId
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting technician jobs:', error);
      return [];
    }
  }

  // Assign job to technician
  async assignJob(jobId, technicianId) {
    try {
      // Create JobTechnician relation
      await prisma.jobTechnician.create({
        data: {
          jobId: jobId,
          technicianId: technicianId,
          role: 'PRIMARY',
          assignedAt: new Date()
        }
      });

      // Update job status
      return await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'ASSIGNED'
        }
      });
    } catch (error) {
      console.error('Error assigning job:', error);
      throw error;
    }
  }

  // Update job status
  async updateJobStatus(jobId, status) {
    try {
      return await prisma.job.update({
        where: { id: jobId },
        data: { status }
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  // Get technician statistics
  async getTechnicianStats(technicianId) {
    try {
      const technician = await prisma.technician.findUnique({
        where: { 
          OR: [
            { whatsappJid: technicianId + '@s.whatsapp.net' },
            { phone: technicianId }
          ]
        }
      });

      if (!technician) {
        return null;
      }

      const completedJobs = await prisma.job.count({
        where: {
          technicians: {
            some: {
              technicians: {
            some: {
              technicianId: technician.id
            }
          }
            }
          },
          status: 'COMPLETED'
        }
      });

      const activeJobs = await prisma.job.count({
        where: {
          technicians: {
            some: {
              technicians: {
            some: {
              technicianId: technician.id
            }
          }
            }
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        }
      });

      const totalJobs = completedJobs + activeJobs;

      return {
        totalJobs,
        completedJobs,
        activeJobs,
        avgRating: 4.5 // Placeholder for now
      };
    } catch (error) {
      console.error('Error getting technician stats:', error);
      return null;
    }
  }

  // Assign job to technician with phone number
  async assignJobToTechnician(jobNumber, phoneNum) {
    try {
      // Find technician by phone
      const technician = await prisma.technician.findFirst({
        where: { 
          OR: [
            { whatsappJid: phoneNum + '@s.whatsapp.net' },
            { phone: phoneNum }
          ]
        }
      });

      if (!technician) {
        return { success: false, message: 'Anda belum terdaftar sebagai teknisi. Silakan /daftar terlebih dahulu.' };
      }

      // Find job by number
      const job = await prisma.job.findFirst({
        where: { jobNumber },
        include: { technicians: true }
      });

      console.log(`🔍 Debug job ${jobNumber}:`, {
        found: !!job,
        status: job?.status,
        techniciansCount: job?.technicians?.length || 0,
        technicians: job?.technicians?.map(t => t.technicianId) || []
      });

      if (!job) {
        return { success: false, message: 'Pekerjaan tidak ditemukan.' };
      }

      // Check if job is available for assignment
      if (job.status !== 'OPEN' && job.status !== 'ASSIGNED') {
        console.log(`❌ Job ${jobNumber} status: ${job.status} (not available)`);
        return { success: false, message: 'Pekerjaan ini sudah diambil atau selesai.' };
      }

      // Check if job already has a technician assigned
      if (job.technicians && job.technicians.length > 0) {
        console.log(`❌ Job ${jobNumber} already has ${job.technicians.length} technician(s)`);
        return { success: false, message: 'Pekerjaan ini sudah diambil teknisi lain.' };
      }

      // Assign job using JobTechnician relation
      await prisma.jobTechnician.create({
        data: {
          jobId: job.id,
          technicianId: technician.id,
          role: 'PRIMARY',
          assignedAt: new Date()
        }
      });

      // Update job status
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'ASSIGNED'
        },
        include: {
          customer: true,
          technicians: {
            include: {
              technician: true
            }
          }
        }
      });

      // Send notification to customer
      try {
        const CustomerNotificationService = require('../../utils/customerNotificationService');
        await CustomerNotificationService.notifyJobStatusChange(updatedJob, 'OPEN', 'ASSIGNED');
      } catch (customerNotifError) {
        console.error('Customer notification error:', customerNotifError);
      }

      return { success: true, message: 'Pekerjaan berhasil diambil' };
    } catch (error) {
      console.error('Error assigning job:', error);
      return { success: false, message: 'Gagal mengambil pekerjaan: ' + error.message };
    }
  }

  // Start job
  async startJob(jobNumber, phoneNum) {
    try {
      // Find technician
      const technician = await prisma.technician.findFirst({
        where: { 
          OR: [
            { whatsappJid: phoneNum + '@s.whatsapp.net' },
            { phone: phoneNum }
          ]
        }
      });

      if (!technician) {
        return { success: false, message: 'Anda belum terdaftar sebagai teknisi.' };
      }

      // Find job
      const job = await prisma.job.findFirst({
        where: { 
          jobNumber,
          technicians: {
            some: {
              technicianId: technician.id
            }
          }
        }
      });

      if (!job) {
        return { success: false, message: 'Pekerjaan tidak ditemukan atau bukan milik Anda.' };
      }

      if (job.status !== 'ASSIGNED') {
        return { success: false, message: 'Pekerjaan sudah dimulai atau selesai.' };
      }

      // Update job status
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'IN_PROGRESS'
        },
        include: {
          customer: true,
          technicians: {
            include: {
              technician: true
            }
          }
        }
      });

      // Send notification to customer
      try {
        const CustomerNotificationService = require('../../utils/customerNotificationService');
        await CustomerNotificationService.notifyJobStatusChange(updatedJob, 'ASSIGNED', 'IN_PROGRESS');
      } catch (customerNotifError) {
        console.error('Customer notification error:', customerNotifError);
      }

      // Update JobTechnician acceptedAt
      await prisma.jobTechnician.updateMany({
        where: {
          jobId: job.id,
          technician: {
            OR: [
              { phone: phoneNum },
              { whatsappJid: phoneNum + '@s.whatsapp.net' }
            ]
          }
        },
        data: {
          acceptedAt: new Date()
        }
      });

      return { success: true, message: 'Pekerjaan dimulai' };
    } catch (error) {
      console.error('Error starting job:', error);
      return { success: false, message: 'Gagal memulai pekerjaan: ' + error.message };
    }
  }

  // Complete job
  async completeJob(jobNumber, phoneNum, notes = '') {
    try {
      // Find technician
      const technician = await prisma.technician.findFirst({
        where: { 
          OR: [
            { whatsappJid: phoneNum + '@s.whatsapp.net' },
            { phone: phoneNum }
          ]
        }
      });

      if (!technician) {
        return { success: false, message: 'Anda belum terdaftar sebagai teknisi.' };
      }

      // Find job
      const job = await prisma.job.findFirst({
        where: { 
          jobNumber,
          technicians: {
            some: {
              technicianId: technician.id
            }
          }
        }
      });

      if (!job) {
        return { success: false, message: 'Pekerjaan tidak ditemukan atau bukan milik Anda.' };
      }

      if (job.status === 'COMPLETED') {
        return { success: false, message: 'Pekerjaan sudah selesai.' };
      }

      // Update job status
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          notes: notes || job.notes
        },
        include: {
          customer: true,
          technicians: {
            include: {
              technician: true
            }
          }
        }
      });

      // Send notification to customer
      try {
        const CustomerNotificationService = require('../../utils/customerNotificationService');
        await CustomerNotificationService.notifyJobStatusChange(updatedJob, 'IN_PROGRESS', 'COMPLETED');
      } catch (customerNotifError) {
        console.error('Customer notification error:', customerNotifError);
      }

      return { success: true, message: 'Pekerjaan selesai' };
    } catch (error) {
      console.error('Error completing job:', error);
      return { success: false, message: 'Gagal menyelesaikan pekerjaan: ' + error.message };
    }
  }

  // Get pending notifications
  async getPendingNotifications() {
    try {
      const notifs = await prisma.notification.findMany({
        where: { 
          status: 'PENDING',
          // Include both technician and customer notifications
          OR: [
            { type: 'WHATSAPP' }, // All WhatsApp notifications
            { type: 'CUSTOMER' }  // Customer-specific notifications
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: 20
      });
      
      console.log(`🔍 getPendingNotifications: Found ${notifs.length} pending notifications`);
      notifs.forEach(notif => {
        console.log(`  - ID: ${notif.id}, Type: ${notif.type}, Recipient: ${notif.recipient}, JobId: ${notif.jobId}`);
      });
      
      return notifs;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notification as sent
  async markNotificationSent(notificationId) {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT', sentAt: new Date() }
      });
      return true;
    } catch (error) {
      console.error('Error marking notification:', error);
      return false;
    }
  }
}

module.exports = new BotDatabaseService();
