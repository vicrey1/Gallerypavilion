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
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return withPrismaRetry(operation, retries - 1)
    }
    throw error
  }
}
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, create a new instance each time
  // This ensures we don't share connections between serverless functions
  globalForPrisma.prisma = makePrisma()
}