#!/usr/bin/env node
// Script to normalize existing client emails to lowercase in the development SQLite DB
// Usage: node scripts/normalize-client-emails.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Scanning clients...')
  const clients = await prisma.client.findMany()
  console.log(`Found ${clients.length} clients`)

  for (const c of clients) {
    if (!c.email) continue
    const normalized = c.email.trim().toLowerCase()
    if (c.email !== normalized) {
      console.log(`Updating client ${c.id}: ${c.email} -> ${normalized}`)
      await prisma.client.update({ where: { id: c.id }, data: { email: normalized } })
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
