import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Always reuse the singleton — in production this prevents each request from
// spawning a new PrismaClient whose connection pool Render immediately drops.
export const db = globalForPrisma.prisma || new PrismaClient()

globalForPrisma.prisma = db
