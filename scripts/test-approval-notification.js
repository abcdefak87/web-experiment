const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testApprovalNotification() {
  try {
    console.log('🔍 Testing technician approval notification system...\n');
    
    // Get the latest approved registration
    const latestApproval = await prisma.technicianRegistration.findFirst({
      where: { 
        status: 'APPROVED'
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        approvedBy: true,
        rejectedBy: true
      }
    });
    
    if (!latestApproval) {
      console.log('❌ No approved registrations found');
      return;
    }
    
    console.log('📋 Latest Approved Registration:');
    console.log('================================');
    console.log(`ID: ${latestApproval.id}`);
    console.log(`WhatsApp Number: ${latestApproval.whatsappNumber}`);
    console.log(`WhatsApp JID: ${latestApproval.whatsappJid || '❌ MISSING'}`);
    console.log(`Status: ${latestApproval.status}`);
    console.log(`Updated: ${latestApproval.updatedAt}`);
    
    if (latestApproval.approvedBy) {
      console.log(`\nApproved By: ${latestApproval.approvedBy.name}`);
      console.log(`Approver Username: ${latestApproval.approvedBy.username}`);
    } else {
      console.log('\n❌ No approver information');
    }
    
    // Get user/technician linked to this registration
    const linkedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: latestApproval.whatsappNumber },
          { whatsappNumber: latestApproval.whatsappNumber }
        ]
      }
    });
    
    if (linkedUser) {
      console.log(`\nLinked User ID: ${linkedUser.id}`);
      console.log(`Username: ${linkedUser.username}`);
      console.log(`User Phone: ${linkedUser.phone}`);
      console.log(`Role: ${linkedUser.role}`);
    } else {
      console.log('\n❌ No user account linked to this registration');
    }
    
    // Check if notification was created for this approval
    console.log('\n\n🔔 Checking for related notifications...');
    console.log('=========================================');
    
    // Search for notifications to this recipient around the approval time
    const recipientJid = latestApproval.whatsappJid || `${latestApproval.whatsappNumber}@s.whatsapp.net`;
    
    const relatedNotifications = await prisma.notification.findMany({
      where: {
        recipient: recipientJid,
        createdAt: {
          gte: new Date(latestApproval.updatedAt.getTime() - 60000), // 1 minute before
          lte: new Date(latestApproval.updatedAt.getTime() + 60000)  // 1 minute after
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (relatedNotifications.length > 0) {
      console.log(`✅ Found ${relatedNotifications.length} related notification(s):`);
      relatedNotifications.forEach((notif, idx) => {
        console.log(`\n${idx + 1}. Notification #${notif.id}`);
        console.log(`   Status: ${notif.status}`);
        console.log(`   Created: ${notif.createdAt}`);
        console.log(`   Message preview: ${notif.message.substring(0, 100)}...`);
      });
    } else {
      console.log('❌ No notifications found for this approval!');
      console.log(`   Expected recipient: ${recipientJid}`);
      console.log(`   Approval time: ${latestApproval.updatedAt}`);
      
      // Create a test notification manually
      console.log('\n💡 Creating test notification manually...');
      
      const testNotif = await prisma.notification.create({
        data: {
          type: 'WHATSAPP',
          recipient: recipientJid,
          message: `🎉 *Test Notification untuk Approval*\n\nHai, ini adalah test notifikasi untuk approval teknisi.\n\nJika Anda menerima pesan ini, berarti sistem notifikasi berfungsi.\n\nRegistration ID: ${latestApproval.id}\nApproved at: ${latestApproval.updatedAt}`,
          status: 'PENDING'
        }
      });
      
      console.log(`✅ Test notification created: #${testNotif.id}`);
      console.log('   Status: PENDING');
      console.log(`   Recipient: ${testNotif.recipient}`);
      console.log('   This should be sent within 5 seconds by the WhatsApp bot');
    }
    
    // Check all pending notifications
    console.log('\n\n📊 All current PENDING notifications:');
    console.log('=====================================');
    
    const allPending = await prisma.notification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (allPending.length > 0) {
      console.log(`Found ${allPending.length} pending notification(s):`);
      allPending.forEach((notif, idx) => {
        console.log(`${idx + 1}. #${notif.id} - ${notif.recipient || 'NO RECIPIENT'} - Created: ${notif.createdAt}`);
      });
    } else {
      console.log('No pending notifications in queue');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovalNotification();
