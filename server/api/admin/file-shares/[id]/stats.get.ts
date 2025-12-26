import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSession } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  event.context.session = session
  requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Share ID is required',
    })
  }

  const stats = await prisma.fileDownloadStat.findMany({
    where: {
      sharedFileId: id,
    },
    orderBy: {
      downloadedAt: 'desc',
    },
  })

  return stats
})
