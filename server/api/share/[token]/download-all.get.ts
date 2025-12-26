import { createReadStream } from 'fs'
import { readdir } from 'fs/promises'
import { join, basename } from 'path'
import archiver from 'archiver'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo, precheckFilesSize } from '@@/server/utils/files'
import { getUserIpAddress } from '~~/server/utils/ips'


export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const config = useRuntimeConfig(event)
  const folderPath = (query.path as string) || ''
  const signature = query.sig as string
  const expiryTime = query.exp as string

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Share token is required',
    })
  }

  if (!signature || !expiryTime) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters',
    })
  }

  const parsedExpiry = Number.parseInt(expiryTime, 10)
  if (Number.isNaN(parsedExpiry)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid expiry time'
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

  // Verify signature
  if (!verifyFileSignature(folderPath, token, signature, parsedExpiry, true)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid signature',
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
  const files = []
  for (const entry of entries) {
    if (!entry.name.startsWith('.')) continue // skip hidden files

    if (entry.isFile()) {
      files.push(entry) // direct file
    } else if (entry.isSymbolicLink()) {
      // follow first
      const fullPath = join(requestedPath, entry.name)
      const stats = await getFileInfo(fullPath) // resolve symlink
      if (stats.isFile) {
        files.push(entry) // add if it's a file
      }
    }
  }

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No files to download in this folder',
    })
  }

  await precheckFilesSize(files.map((ff) => join(requestedPath, ff.name)), config.maxBulkSizeBytes)

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
      ipAddress: getUserIpAddress(event) || 'unknown',
      userAgent: headers['user-agent'] || 'unknown',
    },
  })

  return sendStream(event, archive)
})
