import { readdir } from 'fs/promises'
import { join } from 'path'
import { requireAuth } from '@@/server/utils/auth';
import { getSession } from '@@/server/utils/session'
import { getFilesDirectory, sanitizePath, getFileInfo } from '@@/server/utils/files'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  event.context.session = session
  requireAuth(event)

  const query = getQuery(event)
  const path = (query.path as string) || ''

  const filesDir = getFilesDirectory()
  const absolutePath = sanitizePath(path, filesDir)

  const info = await getFileInfo(absolutePath)

  if (!info.isDirectory) {
    throw createError({
      statusCode: 400,
      message: 'Path must be a directory',
    })
  }

  const entries = await readdir(absolutePath, { withFileTypes: true })
  
  const items = await Promise.all(
    entries.map(async (entry) => {
      const itemPath = join(absolutePath, entry.name)
      const stats = await getFileInfo(itemPath)
      
      return {
        name: entry.name,
        path: join(path, entry.name),
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        size: stats.size,
        modified: stats.modified,
      }
    })
  )

  return {
    currentPath: path,
    items: items.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    }),
  }
})
