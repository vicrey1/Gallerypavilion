import { PrismaClientOptions } from '@prisma/client/runtime/library'

const config: PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL as string
    }
  },
  errorFormat: 'pretty',
  log: ['warn', 'error']
}

export default config
