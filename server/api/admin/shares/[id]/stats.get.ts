import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSessionToken } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)
  event.context.session = session
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Share ID is required',
    })
  }

  const stats = await prisma.downloadStat.findMany({
    where: { sharedFolderId: id },
    orderBy: { downloadedAt: 'desc' },
  })

  return stats
})
