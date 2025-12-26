import { readdir } from 'fs/promises'
import { join } from 'path'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo } from '@@/server/utils/files'
import { getSessionShare } from '~~/server/utils/session'

export type BrowseItem = {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  size: number
  modified: string
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const subPath = (query.path as string) || ''
  const showHidden = query.showHidden === 'true'

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Share token is required',
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

  const filesDir = getFilesDirectory()
  const sharePath = sanitizePath(share.path, filesDir)
  const requestedPath = sanitizePath(join(share.path, subPath), filesDir)

  // Ensure requested path is within share path
  if (!requestedPath.startsWith(sharePath)) {
    throw createError({
      statusCode: 403,
      message: 'Access denied',
    })
  }

  const info = await getFileInfo(requestedPath)

  if (!info.isDirectory) {
    throw createError({
      statusCode: 400,
      message: 'Path must be a directory',
    })
  }

  const entries = await readdir(requestedPath, { withFileTypes: true })
  const filteredEntries = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'))
  
  const items = await Promise.all(
    filteredEntries.map(async (entry) => {
      const itemPath = join(requestedPath, entry.name)
      const stats = await getFileInfo(itemPath)
      
      return {
        name: entry.name,
        path: join(subPath, entry.name),
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size: stats.size,
        modified: stats.modified.toUTCString(),
      } as BrowseItem
    })
  )

  return {
    currentPath: subPath,
    items: items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    }),
  }
})
