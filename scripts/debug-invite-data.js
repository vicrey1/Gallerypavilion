const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const codes = ['TESTu93gdg','nw5iHxfDCxzG'];
    for (const code of codes) {
      console.log('\n=== Checking invite code:', code);
      const invite = await prisma.invite.findFirst({ where: { inviteCode: code } });
      console.log('invite:', invite ? { id: invite.id, galleryId: invite.galleryId, inviteCode: invite.inviteCode } : null);
      if (!invite) continue;
      const gallery = await prisma.gallery.findUnique({ where: { id: invite.galleryId }, include: { photos: true } });
      console.log('gallery found:', !!gallery, 'photo count:', gallery?.photos?.length || 0);
      if (gallery && gallery.photos) {
        for (const p of gallery.photos) {
          console.log('photo', p.id, 'tags type:', typeof p.tags, 'tags value:', p.tags);
          try {
            const tags = p.tags ? JSON.parse(p.tags) : [];
            console.log('parsed tags:', tags);
          } catch (e) {
            console.error('JSON parse error for photo', p.id, e.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
