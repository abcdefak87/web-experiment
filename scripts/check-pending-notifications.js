const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    console.log('🔍 Checking pending notifications in database...\n');
    
    // Get all pending notifications
    const pendingNotifications = await prisma.notification.findMany({
      where: { 
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Total pending notifications: ${pendingNotifications.length}\n`);
    
    if (pendingNotifications.length > 0) {
      console.log('📋 Pending notifications details:');
      console.log('=====================================');
      
      pendingNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. Notification #${notif.id}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Recipient: ${notif.recipient || '❌ NO RECIPIENT'}`);
        console.log(`   JobId: ${notif.jobId || 'N/A'}`);
        console.log(`   Status: ${notif.status}`);
        console.log(`   Created: ${notif.createdAt}`);
        console.log(`   Message preview: ${notif.message.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ No pending notifications found');
    }
    
    // Check recent sent notifications
    console.log('\n\n📤 Recent SENT notifications (last 5):');
    console.log('=====================================');
    
    const sentNotifications = await prisma.notification.findMany({
      where: { 
        status: 'SENT'
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    
    if (sentNotifications.length > 0) {
      sentNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. Notification #${notif.id}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Recipient: ${notif.recipient}`);
        console.log(`   Sent at: ${notif.updatedAt}`);
        console.log(`   Message preview: ${notif.message.substring(0, 80)}...`);
      });
    } else {
      console.log('No sent notifications found');
    }
    
    // Check technician registrations with WhatsApp JID
    console.log('\n\n👷 Recent technician registrations:');
    console.log('=====================================');
    
    const techRegistrations = await prisma.technicianRegistration.findMany({
      where: {
        status: 'APPROVED'
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    
    if (techRegistrations.length > 0) {
      techRegistrations.forEach((reg, index) => {
        console.log(`\n${index + 1}. Registration #${reg.id}`);
        console.log(`   Name: ${reg.name}`);
        console.log(`   WhatsApp Number: ${reg.whatsappNumber}`);
        console.log(`   WhatsApp JID: ${reg.whatsappJid || '❌ MISSING JID'}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Updated: ${reg.updatedAt}`);
      });
    } else {
      console.log('No approved technician registrations found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
