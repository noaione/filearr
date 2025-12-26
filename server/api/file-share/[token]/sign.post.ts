import { signFilePath, getExpiryTime } from '@@/server/utils/files'
import prisma from '@@/server/utils/db'
import { getSessionShare } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

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

  // Check authentication if password protected
  if (share.password) {
    const session = await getSessionShare(event, share.id)
    if (session.shareId !== share.id) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      })
    }
  }

  // Generate signature for the file
  const expiry = getExpiryTime()
  const signature = signFilePath(share.path, token, expiry).digest('hex')

  return {
    signature,
    expiry,
    path: share.path,
  }
})
