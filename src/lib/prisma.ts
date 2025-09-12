import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function makePrisma() {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
    datasources: {
      db: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, create a new instance each time
  // This ensures we don't share connections between serverless functions
  globalForPrisma.prisma = makePrisma()
}