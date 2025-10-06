const { PrismaClient } = require('../server/node_modules/@prisma/client');
const bcrypt = require('../server/node_modules/bcryptjs');
const prisma = new PrismaClient();

async function resendApprovalNotifications() {
  try {
    console.log('🔧 Resending approval notifications for technicians without notifications...\n');
    
    // Get all approved registrations from today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const approvedRegistrations = await prisma.technicianRegistration.findMany({
      where: { 
        status: 'APPROVED',
        updatedAt: {
          gte: todayStart
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`Found ${approvedRegistrations.length} approved registrations today\n`);
    
    for (const registration of approvedRegistrations) {
      console.log(`\nProcessing registration #${registration.id}:`);
      console.log(`  Name: ${registration.firstName} ${registration.lastName || ''}`);
      console.log(`  WhatsApp: ${registration.whatsappNumber}`);
      console.log(`  JID: ${registration.whatsappJid || 'MISSING'}`);
      
      // Fix missing JID
      if (!registration.whatsappJid && registration.whatsappNumber) {
        const jid = `${registration.whatsappNumber}@s.whatsapp.net`;
        await prisma.technicianRegistration.update({
          where: { id: registration.id },
          data: { whatsappJid: jid }
        });
        registration.whatsappJid = jid;
        console.log(`  ✅ Fixed JID: ${jid}`);
      }
      
      const recipientJid = registration.whatsappJid || `${registration.whatsappNumber}@s.whatsapp.net`;
      
      // Check if notification already sent
      const existingNotif = await prisma.notification.findFirst({
        where: {
          recipient: recipientJid,
          message: {
            contains: 'Pendaftaran Anda sebagai teknisi telah *DISETUJUI*'
          },
          createdAt: {
            gte: new Date(registration.updatedAt.getTime() - 30 * 60 * 1000), // 30 minutes window
          }
        }
      });
      
      if (existingNotif) {
        console.log(`  ✅ Notification already sent: #${existingNotif.id} (${existingNotif.status})`);
        continue;
      }
      
      // Find linked user account
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: registration.whatsappNumber },
            { whatsappNumber: registration.whatsappNumber }
          ]
        }
      });
      
      if (!user) {
        console.log(`  ❌ No user account found - creating one...`);
        
        // Create user account
        const username = registration.whatsappNumber;
        const password = 'Tech@2025';
        const passwordHash = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
          data: {
            name: `${registration.firstName} ${registration.lastName || ''}`.trim() || 'Teknisi',
            username,
            password: passwordHash,
            role: 'teknisi',
            isActive: true,
            isVerified: true,
            phone: registration.whatsappNumber,
            whatsappNumber: registration.whatsappNumber
          }
        });
        
        console.log(`  ✅ User account created: ${newUser.username}`);
        
        // Create notification
        const notif = await prisma.notification.create({
          data: {
            type: 'WHATSAPP',
            recipient: recipientJid,
            message: `🎉 *Selamat!*\n\nPendaftaran Anda sebagai teknisi telah *DISETUJUI*.\n\n📱 *Akun Dashboard:*\n👤 Username: ${username}\n🔑 Password: ${password}\n\n🔗 Login di: http://localhost:3000\n\n⚠️ *PENTING:* Segera ganti password setelah login!\n\n*Fitur yang tersedia:*\n✅ Melihat pekerjaan tersedia (/jobs)\n✅ Mengambil pekerjaan (/ambil)\n✅ Update status pekerjaan\n✅ Melihat statistik (/stats)\n\nSelamat bekerja! 💪`,
            status: 'PENDING'
          }
        });
        
        console.log(`  ✅ Notification created: #${notif.id} (PENDING)`);
        
      } else {
        console.log(`  ✅ User account exists: ${user.username}`);
        
        // Create notification for existing user
        const notif = await prisma.notification.create({
          data: {
            type: 'WHATSAPP',
            recipient: recipientJid,
            message: `🎉 *Selamat!*\n\nPendaftaran Anda sebagai teknisi telah *DISETUJUI*.\n\n📱 *Akun Dashboard:*\n👤 Username: ${user.username}\n🔑 Password: (gunakan password yang sudah ada)\n\n🔗 Login di: http://localhost:3000\n\n*Fitur yang tersedia:*\n✅ Melihat pekerjaan tersedia (/jobs)\n✅ Mengambil pekerjaan (/ambil)\n✅ Update status pekerjaan\n✅ Melihat statistik (/stats)\n\nSelamat bekerja! 💪`,
            status: 'PENDING'
          }
        });
        
        console.log(`  ✅ Notification created: #${notif.id} (PENDING)`);
      }
    }
    
    // Show pending notifications
    const pendingCount = await prisma.notification.count({
      where: { status: 'PENDING' }
    });
    
    console.log('\n\n📊 Summary:');
    console.log('===========');
    console.log(`✅ Processed ${approvedRegistrations.length} approved registrations`);
    console.log(`📨 Pending notifications in queue: ${pendingCount}`);
    
    if (pendingCount > 0) {
      console.log('\n⏰ Notifications will be sent within 5 seconds by WhatsApp bot');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resendApprovalNotifications();
