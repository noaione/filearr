import { join, extname } from 'path'
import { stat } from 'fs/promises'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory } from '@@/server/utils/files'
import { getSessionShare } from '~~/server/utils/session'
import * as mimeTypes from 'mime-types'

// add new type
mimeTypes.types['.tgz'] = 'application/gzip'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const filePath = (query.path as string) || ''

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
  const requestedPath = sanitizePath(join(share.path, filePath), filesDir)

  // Ensure requested path is within share path
  if (!requestedPath.startsWith(sharePath)) {
    throw createError({
      statusCode: 403,
      message: 'Access denied',
    })
  }

  try {
    const fileStats = await stat(requestedPath)

    if (!fileStats.isFile()) {
      throw createError({
        statusCode: 400,
        message: 'Path is not a file',
      })
    }

    const extension = extname(requestedPath)
    const mimeType = mimeTypes.lookup(requestedPath) || 'application/octet-stream'
    const fileName = filePath.split('/').pop() || 'unknown'

    return {
      name: fileName,
      path: filePath,
      size: fileStats.size,
      mimeType,
      extension: extension || 'none',
      modified: fileStats.mtime.toISOString(),
      created: fileStats.birthtime.toISOString(),
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        message: 'File not found',
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to get file information',
    })
  }
})
