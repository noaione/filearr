import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSession } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  event.context.session = session
  requireAuth(event)

  const shares = await prisma.sharedFolder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      downloadStats: {
        select: {
          id: true,
        },
      },
    },
  })

  return shares.map(share => ({
    ...share,
    downloadCount: share.downloadStats.length,
    downloadStats: undefined,
  }))
})
