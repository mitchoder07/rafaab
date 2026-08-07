import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create the adapter using the same DATABASE_URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const db = globalForPrisma.prisma ?? new PrismaClient({
  adapter,           // <-- pass the adapter here
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db