import prisma from '@@/server/utils/db'
import { comparePassword } from '@@/server/utils/auth'
import { getSessionShare } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const { password } = await readBody(event)

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Share token is required',
    })
  }

  const share = await prisma.sharedFile.findUnique({
    where: { shareToken: token },
  })

  if (!share) {
    throw createError({
      statusCode: 404,
      message: 'Share not found',
    })
  }

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'Share has expired',
    })
  }

  // Verify password
  if (share.password) {
    if (!password) {
      throw createError({
        statusCode: 401,
        message: 'Password is required',
      })
    }

    const isValid = await comparePassword(password, share.password)
    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid password',
      })
    }
  }

  // Set session
  const session = await getSessionShare(event, share.id)
  session.shareId = share.id
  await session.save()

  return { success: true }
})
