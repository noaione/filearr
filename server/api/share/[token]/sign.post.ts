import prisma from '@@/server/utils/db'
import { getExpiryTime, signFilePath } from '@@/server/utils/files'
import { getSessionShare } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const { path, bulk } = await readBody(event)

  if (!token || !path) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters',
    })
  }

  const share = await prisma.sharedFolder.findUnique({
    where: { shareToken: token },
  })

  if (!share) {
    throw createError({
      statusCode: 404,
      message: 'Share not found',
    })
  }

  const session = await getSessionShare(event, share.id)
  if (session.shareId !== share.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized access to share',
    })
  }

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'Share has expired',
    })
  }

  const expiry = getExpiryTime()
  const signature = signFilePath(path, token, expiry, Boolean(bulk))
  return {
    sig: signature,
    exp: expiry,
  }
})
