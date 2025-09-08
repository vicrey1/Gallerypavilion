import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Retry helper: retries the provided async function up to `retries` times with exponential backoff.
export async function withPrismaRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 250): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      // For Prisma connector errors and transient network issues, retry; otherwise rethrow.
      const msg = err && (err as Error).message ? (err as Error).message : ''
      const isTransient = msg.includes('connection') || msg.includes('terminated') || msg.includes('timeout') || msg.includes('could not connect') || msg.includes('closed')
      if (!isTransient || attempt > retries) {
        throw err
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await new Promise((res) => setTimeout(res, delay))
    }
  }
}