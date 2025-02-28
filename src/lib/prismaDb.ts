import { PrismaClient } from '@prisma/client';

// Hardcoded connection string for AWS RDS PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'], // Enable detailed logs for debugging
});

export default prisma;
