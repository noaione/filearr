import prisma from '@@/server/utils/db'
import { signFilePath } from '@@/server/utils/files'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const { path } = await readBody(event)

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

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'Share has expired',
    })
  }

  const signature = signFilePath(path, token)
  return signature
})
