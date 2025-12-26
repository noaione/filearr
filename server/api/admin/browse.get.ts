import { readdir, realpath } from 'fs/promises'
import { join } from 'path'
import { requireAuth } from '@@/server/utils/auth';
import { getSessionToken } from '@@/server/utils/session'
import { getFilesDirectory, sanitizePath, getFileInfo } from '@@/server/utils/files'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)
  event.context.session = session
  await requireAuth(event)

  const query = getQuery(event)
  const path = (query.path as string) || ''
  const showHidden = query.showHidden === 'true'

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
  const filteredEntries = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'))

  const items = await Promise.all(
    filteredEntries.map(async (entry) => {
      const itemPath = join(absolutePath, entry.name)
      const stats = await getFileInfo(itemPath)

      return {
        name: entry.name,
        path: join(path, entry.name),
        isDirectory: stats.isDirectory,
        isFile: stats.isFile,
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
