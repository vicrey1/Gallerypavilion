#!/usr/bin/env node
// Script to normalize existing invite codes to lowercase in the development SQLite DB
// Usage: node scripts/normalize-invite-codes.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Scanning invites...')
  const invites = await prisma.invite.findMany()
  console.log(`Found ${invites.length} invites`)

  for (const inv of invites) {
    const normalized = inv.inviteCode.toLowerCase()
    if (inv.inviteCode !== normalized) {
      console.log(`Updating invite ${inv.id}: ${inv.inviteCode} -> ${normalized}`)
      await prisma.invite.update({ where: { id: inv.id }, data: { inviteCode: normalized } })
    }
  }

  console.log('Done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
