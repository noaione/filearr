import bcrypt from 'bcryptjs'
import { H3Event, createError } from 'h3'
import prisma from './db'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

function b64DecodeOrError(str: string): string {
  try {
    return Buffer.from(str, 'base64').toString('utf-8')
  } catch (err) {
    throw createError({
      statusCode: 400,
      message: 'Invalid base64 encoding',
    })
  }
}

async function assignBasicAuthIfPossible(event: H3Event) {
  const authHeader = event.node.req.headers['authorization']
  if (!authHeader) {
    // ignore
    return
  }

  if (!authHeader.startsWith('Basic ')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid authorization header',
    })
  }

  const base64Credentials = authHeader.slice(6)
  const credentials = b64DecodeOrError(base64Credentials)
  const [username, password] = credentials.split(':')

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Invalid authorization header',
    })
  }

  const result = await prisma.user.findFirst({ where: { username } })
  if (!result) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  const isValid = await comparePassword(password, result.password)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Set session
  event.context.session = {
    isLoggedIn: true,
    userId: result.id,
    username: result.username,
  }
}

export async function requireAuth(event: H3Event) {
  await assignBasicAuthIfPossible(event)

  if (!event.context.session?.isLoggedIn) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
}
