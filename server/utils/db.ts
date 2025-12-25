import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@@/generated/prisma'

const prismaClientSingleton = () => {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? '',
  });
  return new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
