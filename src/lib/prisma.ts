import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Edge-native WebSocket for Cloudflare/Neon
if (typeof WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = WebSocket
}

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
// @ts-ignore: Prisms explicitly supports neon serverless pool
const adapter = new PrismaNeon(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
