import prisma from '@@/server/utils/db'

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

  const session = await getSessionShare(event, share.id)

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Gone',
      message: 'Share has expired',
    })
  }

  return {
    name: share.name,
    token: share.shareToken,
    passwordProtected: Boolean(share.password),
    expiresAt: share.expiresAt,
    isAuthenticated: session.shareId === share.id,
  }
})
