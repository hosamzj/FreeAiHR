import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Debug: Log the database URL being used (mask sensitive parts)
const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log(`[Prisma] DATABASE_URL: ${maskedUrl}`);

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
