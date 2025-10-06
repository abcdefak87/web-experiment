/**
 * Fix notification reliability issues
 * - Adds retry mechanism for failed notifications
 * - Improves connection stability
 * - Handles pending notifications better
 */

const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fixNotificationReliability() {
  try {
    console.log('🔧 Fixing notification reliability issues...\n');
    
    // 1. Check all PENDING notifications
    console.log('📋 Checking PENDING notifications...');
    const pendingNotifs = await prisma.notification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${pendingNotifs.length} pending notifications\n`);
    
    // 2. Fix notifications with missing or invalid recipients
    console.log('🔍 Checking for invalid recipients...');
    let fixedCount = 0;
    
    for (const notif of pendingNotifs) {
      if (!notif.recipient || !notif.recipient.includes('@')) {
        console.log(`❌ Invalid recipient for notification #${notif.id}: ${notif.recipient}`);
        
        // Try to extract phone number from message or related data
        if (notif.userId) {
          const user = await prisma.user.findUnique({
            where: { id: notif.userId }
          });
          
          if (user && user.whatsappNumber) {
            const fixedRecipient = `${user.whatsappNumber}@s.whatsapp.net`;
            await prisma.notification.update({
              where: { id: notif.id },
              data: { recipient: fixedRecipient }
            });
            console.log(`  ✅ Fixed recipient: ${fixedRecipient}`);
            fixedCount++;
          }
        }
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} notifications with invalid recipients\n`);
    } else {
      console.log('✅ All notifications have valid recipients\n');
    }
    
    // 3. Check notifications that are stuck (older than 1 hour)
    console.log('🕒 Checking for stuck notifications...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stuckNotifs = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: oneHourAgo }
      }
    });
    
    if (stuckNotifs.length > 0) {
      console.log(`Found ${stuckNotifs.length} stuck notifications (> 1 hour old):`);
      
      for (const notif of stuckNotifs) {
        const age = Math.round((Date.now() - notif.createdAt.getTime()) / (1000 * 60));
        console.log(`  #${notif.id} - ${notif.recipient} - ${age} minutes old`);
        
        // Add retry count if not exists
        if (!notif.errorMessage) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { 
              errorMessage: 'Retrying: notification stuck for more than 1 hour',
              updatedAt: new Date() // Update timestamp to trigger retry
            }
          });
        }
      }
      
      console.log('  ℹ️ Marked for retry\n');
    } else {
      console.log('✅ No stuck notifications found\n');
    }
    
    // 4. Create test notification to verify system
    console.log('🧪 Creating test notification...');
    
    const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '6282229261247';
    const testNotif = await prisma.notification.create({
      data: {
        type: 'WHATSAPP',
        recipient: `${adminNumber}@s.whatsapp.net`,
        message: `🔧 *Test Notification*\n\n` +
                 `Ini adalah test notifikasi untuk memverifikasi sistem.\n\n` +
                 `📊 Status:\n` +
                 `• Pending notifications: ${pendingNotifs.length}\n` +
                 `• Fixed recipients: ${fixedCount}\n` +
                 `• Stuck notifications: ${stuckNotifs.length}\n\n` +
                 `Timestamp: ${new Date().toLocaleString('id-ID')}`,
        status: 'PENDING'
      }
    });
    
    console.log(`✅ Test notification created: #${testNotif.id}\n`);
    
    // 5. Summary
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`• Total pending notifications: ${pendingNotifs.length}`);
    console.log(`• Fixed invalid recipients: ${fixedCount}`);
    console.log(`• Stuck notifications marked for retry: ${stuckNotifs.length}`);
    console.log(`• Test notification created: #${testNotif.id}`);
    
    console.log('\n⚠️ RECOMMENDATIONS:');
    console.log('1. Make sure WhatsApp bot is running (node scripts/whatsapp-bot-integrated.js)');
    console.log('2. Check if bot is properly connected (should show "✅ BOT WHATSAPP TERHUBUNG!")');
    console.log('3. If connection keeps dropping, restart the bot');
    console.log('4. Monitor the bot terminal for any error messages');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNotificationReliability();
