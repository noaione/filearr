import prisma from '@@/server/utils/db'
import { comparePassword } from '@@/server/utils/auth'
import { getSessionShare } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Share token is required',
    })
  }

  const share = await prisma.sharedFolder.findUnique({
    where: { shareToken: token },
  })

  if (!share) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Share not found',
    })
  }

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Gone',
      message: 'Share has expired',
    })
  }

  // Check if password is required
  if (share.password) {
    const { password } = await readBody(event)
    
    if (!password) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Password required',
      })
    }

    const valid = await comparePassword(password, share.password)
    if (!valid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Invalid password',
      })
    }
  }

  const session = await getSessionShare(event, share.id)
  session.shareId = share.id
  await session.save()

  return {
    id: share.id,
    name: share.name,
    shareToken: share.shareToken,
    hasPassword: !!share.password,
    expiresAt: share.expiresAt,
  }
})
