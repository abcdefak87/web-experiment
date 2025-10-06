const { PrismaClient } = require('../server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fixApprovalNotification() {
  try {
    console.log('🔧 Fixing technician approval notification issue...\n');
    
    // 1. Check latest approved registrations without notifications
    const recentApprovals = await prisma.technicianRegistration.findMany({
      where: { 
        status: 'APPROVED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        approvedBy: true,
        rejectedBy: true
      }
    });
    
    console.log(`📋 Found ${recentApprovals.length} recent approvals (last 24 hours)\n`);
    
    for (const approval of recentApprovals) {
      console.log(`\nChecking approval #${approval.id}:`);
      console.log(`  WhatsApp: ${approval.whatsappNumber}`);
      console.log(`  JID: ${approval.whatsappJid || '❌ MISSING'}`);
      console.log(`  Approved: ${approval.updatedAt.toLocaleString()}`);
      
      // Fix missing WhatsApp JID if needed
      if (!approval.whatsappJid && approval.whatsappNumber) {
        const jid = `${approval.whatsappNumber}@s.whatsapp.net`;
        await prisma.technicianRegistration.update({
          where: { id: approval.id },
          data: { whatsappJid: jid }
        });
        approval.whatsappJid = jid;
        console.log(`  ✅ Fixed JID: ${jid}`);
      }
      
      // Check if notification exists
      const recipientJid = approval.whatsappJid || `${approval.whatsappNumber}@s.whatsapp.net`;
      
      const existingNotif = await prisma.notification.findFirst({
        where: {
          recipient: recipientJid,
          message: {
            contains: 'Pendaftaran Anda sebagai teknisi telah *DISETUJUI*'
          },
          createdAt: {
            gte: new Date(approval.updatedAt.getTime() - 5 * 60 * 1000), // 5 minutes window
            lte: new Date(approval.updatedAt.getTime() + 5 * 60 * 1000)
          }
        }
      });
      
      if (existingNotif) {
        console.log(`  ✅ Notification exists: #${existingNotif.id} (${existingNotif.status})`);
      } else {
        console.log(`  ❌ No notification found!`);
        
        // Get linked user account
        const linkedUser = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: approval.whatsappNumber },
              { whatsappNumber: approval.whatsappNumber }
            ]
          }
        });
        
        // Create notification if user exists
        if (linkedUser) {
          console.log(`  🔔 Creating new notification...`);
          
          // Generate a simple password if needed
          const username = linkedUser.username;
          const password = 'Tech@2025'; // Default password for missing credentials
          
          const notif = await prisma.notification.create({
            data: {
              type: 'WHATSAPP',
              recipient: recipientJid,
              message: `🎉 *Selamat! Pendaftaran Disetujui*\n\nHai ${linkedUser.name || approval.firstName || 'Teknisi'}, pendaftaran Anda sebagai teknisi telah *DISETUJUI*.\n\n📱 *Akun Dashboard:*\n👤 Username: ${username}\n🔑 Password: ${password}\n\n🔗 Login di: http://localhost:3000\n\n⚠️ *PENTING:* Segera ganti password setelah login pertama kali!\n\nAnda sekarang dapat:\n✅ Melihat pekerjaan tersedia (/jobs)\n✅ Mengambil pekerjaan (/ambil)\n✅ Update status pekerjaan\n✅ Melihat statistik (/stats)\n\nSelamat bekerja! 💪`,
              status: 'PENDING'
            }
          });
          
          console.log(`  ✅ Notification created: #${notif.id}`);
          console.log(`     Recipient: ${notif.recipient}`);
          console.log(`     Status: PENDING (will be sent in ~5 seconds)`);
        } else {
          console.log(`  ⚠️ No user linked to this registration`);
        }
      }
    }
    
    // 2. Show current notification queue status
    console.log('\n\n📊 Current Notification Queue Status:');
    console.log('=====================================');
    
    const pendingCount = await prisma.notification.count({
      where: { status: 'PENDING' }
    });
    
    const sentTodayCount = await prisma.notification.count({
      where: { 
        status: 'SENT',
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    console.log(`📨 Pending notifications: ${pendingCount}`);
    console.log(`✅ Sent today: ${sentTodayCount}`);
    
    if (pendingCount > 0) {
      const pendingList = await prisma.notification.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 5
      });
      
      console.log('\n🔔 Next notifications to be sent:');
      pendingList.forEach((n, i) => {
        console.log(`${i+1}. ${n.recipient || 'NO RECIPIENT'} - Created: ${n.createdAt.toLocaleString()}`);
      });
    }
    
    // 3. Check WhatsApp bot status
    console.log('\n\n🤖 WhatsApp Bot Integration Check:');
    console.log('=====================================');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if auth session exists
    const authPath = path.join(__dirname, '..', 'auth_info_baileys');
    const sessionExists = fs.existsSync(authPath) && fs.readdirSync(authPath).length > 0;
    
    console.log(`📁 WhatsApp session: ${sessionExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Check if bot is running (by looking for recent activity)
    const recentActivity = await prisma.notification.findFirst({
      where: { 
        status: 'SENT',
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (recentActivity) {
      console.log(`✅ Bot is ACTIVE (last activity: ${recentActivity.updatedAt.toLocaleString()})`);
    } else {
      console.log(`⚠️ Bot may be INACTIVE (no activity in last 5 minutes)`);
      console.log(`   Make sure WhatsApp bot is running with: npm start`);
    }
    
    console.log('\n✨ Fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApprovalNotification();
