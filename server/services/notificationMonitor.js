/**
 * Notification Monitor Service
 * Monitors and processes pending notifications (WhatsApp messages)
 * Retries failed notifications when WhatsApp is connected
 */

const prisma = require('../utils/database');
const logger = require('../utils/logger');

class NotificationMonitor {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 30000; // Check every 30 seconds
    this.maxRetries = 3;
  }

  async start() {
    if (this.isRunning) {
      logger.info('Notification monitor already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting notification monitor service');
    
    // Initial check
    await this.processPendingNotifications();
    
    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.processPendingNotifications();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Notification monitor stopped');
  }

  async processPendingNotifications() {
    try {
      // Check if WhatsApp is connected
      if (!global.whatsappSocket || !global.whatsappSocket.user) {
        logger.debug('WhatsApp not connected, skipping notification processing');
        return;
      }

      // Get pending notifications
      const pendingNotifications = await prisma.notification.findMany({
        where: {
          status: 'PENDING',
          type: 'WHATSAPP',
          OR: [
            { retryCount: null },
            { retryCount: { lt: this.maxRetries } }
          ]
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 10 // Process 10 at a time to avoid overwhelming
      });

      if (pendingNotifications.length === 0) {
        return;
      }

      logger.info(`Processing ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
        
        // Small delay between messages to avoid spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Error processing pending notifications:', error);
    }
  }

  async sendNotification(notification) {
    try {
      const { id, recipient, message, retryCount = 0 } = notification;
      
      // Validate recipient
      if (!recipient || !message) {
        logger.warn(`Invalid notification data: ${id}`);
        await this.markAsFailed(id, 'Invalid recipient or message');
        return;
      }

      // Ensure recipient is in correct format
      const jid = recipient.includes('@') ? recipient : `${recipient}@s.whatsapp.net`;
      
      logger.info(`Sending notification ${id} to ${jid}`);
      
      // Send via WhatsApp
      await global.whatsappSocket.sendMessage(jid, { text: message });
      
      // Mark as sent
      await prisma.notification.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          retryCount: retryCount
        }
      });
      
      logger.info(`Notification ${id} sent successfully`);
      
      // Special handling for registration approvals - log credentials sent
      if (message.includes('Username:') && message.includes('Password:')) {
        logger.info(`Credentials sent to technician via WhatsApp: ${jid}`);
      }
      
    } catch (error) {
      logger.error(`Failed to send notification ${notification.id}:`, error);
      await this.handleSendError(notification, error);
    }
  }

  async handleSendError(notification, error) {
    const { id, retryCount = 0 } = notification;
    const newRetryCount = retryCount + 1;
    
    if (newRetryCount >= this.maxRetries) {
      await this.markAsFailed(id, error.message);
    } else {
      // Update retry count
      await prisma.notification.update({
        where: { id },
        data: {
          retryCount: newRetryCount,
          lastError: error.message
        }
      });
      logger.info(`Notification ${id} will be retried (attempt ${newRetryCount}/${this.maxRetries})`);
    }
  }

  async markAsFailed(id, errorMessage) {
    await prisma.notification.update({
      where: { id },
      data: {
        status: 'FAILED',
        lastError: errorMessage
      }
    });
    logger.error(`Notification ${id} marked as failed: ${errorMessage}`);
  }

  // Manual retry for specific notification
  async retryNotification(notificationId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Reset status to pending for retry
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'PENDING',
          retryCount: 0
        }
      });
      
      // Process immediately
      await this.sendNotification(notification);
      
      return { success: true, message: 'Notification retried successfully' };
    } catch (error) {
      logger.error(`Failed to retry notification ${notificationId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get notification statistics
  async getStats() {
    const stats = await prisma.notification.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    return stats.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.id;
      return acc;
    }, {});
  }
}

// Create singleton instance
const notificationMonitor = new NotificationMonitor();

module.exports = notificationMonitor;
