import prisma from '@@/server/utils/db'
import { hashPassword, comparePassword } from '@@/server/utils/auth'
import { getSession } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: 'Username and password are required',
    })
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Verify password
  const valid = await comparePassword(password, user.password)
  if (!valid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Set session
  const session = await getSession(event)
  session.userId = user.id
  session.username = user.username
  session.isLoggedIn = true
  await session.save()

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
    },
  }
})
