import prisma from '@@/server/utils/db'
import { getSessionShare } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Share token is required',
    })
  }

  const share = await prisma.sharedFile.findUnique({
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
  const filesDir = getFilesDirectory()
  const absolutePath = sanitizePath(share.path, filesDir)

  // check if file exist in filesystem
  const file = await getFileInfo(absolutePath)
  if (!file.isFile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Shared file does not exist',
    })
  }

  return {
    name: share.name,
    path: share.path,
    token: share.shareToken,
    size: file.size,
    passwordProtected: Boolean(share.password),
    expiresAt: share.expiresAt,
    isAuthenticated: session.shareId === share.id,
  }
})
