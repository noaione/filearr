import { createReadStream } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import archiver from 'archiver'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo } from '@@/server/utils/files'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const folderPath = (query.path as string) || ''

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

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'Share has expired',
    })
  }

  const filesDir = getFilesDirectory()
  const sharePath = sanitizePath(share.path, filesDir)
  const requestedPath = sanitizePath(join(share.path, folderPath), filesDir)

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

  // Get all files in the directory (not subdirectories)
  const entries = await readdir(requestedPath, { withFileTypes: true })
  const files = entries.filter(entry => entry.isFile() && !entry.name.startsWith('.'))

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No files to download in this folder',
    })
  }

  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  // Set response headers
  const folderName = folderPath ? basename(folderPath) : share.name
  const zipName = `${folderName}-files.zip`
  
  setResponseHeaders(event, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}"`,
  })

  // Handle archive errors
  archive.on('error', (err) => {
    throw createError({
      statusCode: 500,
      message: 'Failed to create archive',
    })
  })

  // Add files to archive
  for (const file of files) {
    const filePath = join(requestedPath, file.name)
    archive.append(createReadStream(filePath), { name: file.name })
  }

  // Finalize archive
  archive.finalize()

  // Log download stats for the ZIP
  const headers = getHeaders(event)
  await prisma.downloadStat.create({
    data: {
      sharedFolderId: share.id,
      fileName: `${folderPath || '/'} (${files.length} files)`,
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: headers['user-agent'] || 'unknown',
    },
  })

  return sendStream(event, archive)
})
