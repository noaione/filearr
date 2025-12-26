import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSessionToken } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)
  event.context.session = session
  await requireAuth(event)

  const fileShares = await prisma.sharedFile.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          fileDownloadStats: true,
        },
      },
    },
  })

  return fileShares.map((share) => ({
    ...share,
    downloadCount: share._count.fileDownloadStats,
  }))
})
