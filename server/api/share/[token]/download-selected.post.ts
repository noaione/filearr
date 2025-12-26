import { createReadStream } from 'fs'
import { join, basename } from 'path'
import archiver from 'archiver'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo } from '@@/server/utils/files'
import { getUserIpAddress } from '~~/server/utils/ips'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
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

  const body = await readBody(event)
  const paths = JSON.parse(body.paths) as string[]

  if (!Array.isArray(paths) || paths.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No files selected',
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

  // Verify signature (use first path for signature check since it's a bulk operation)
  if (!verifyFileSignature(JSON.stringify(paths), token, signature, parsedExpiry, true)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid signature',
    })
  }

  // Validate all paths and get file info
  const validFiles: Array<{ path: string; name: string }> = []
  for (const filePath of paths) {
    const requestedPath = sanitizePath(join(share.path, filePath), filesDir)

    // Ensure requested path is within share path
    if (!requestedPath.startsWith(sharePath)) {
      throw createError({
        statusCode: 403,
        message: 'Access denied',
      })
    }

    const info = await getFileInfo(requestedPath)
    if (info.isFile) {
      validFiles.push({
        path: requestedPath,
        name: basename(requestedPath)
      })
    }
  }

  if (validFiles.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid files selected',
    })
  }

  // Create ZIP archive
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  // Handle errors
  archive.on('error', (err) => {
    throw createError({
      statusCode: 500,
      message: 'Failed to create archive',
    })
  })

  // Set response headers
  setResponseHeaders(event, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${share.name}-selected.zip"`,
  })

  // Pipe archive to response
  archive.pipe(event.node.res)

  // Add files to archive
  for (const file of validFiles) {
    archive.append(createReadStream(file.path), { name: file.name })
  }

  // Finalize archive
  await archive.finalize()

  // Log download stat
  try {
    const userIp = getUserIpAddress(event)
    await prisma.downloadStat.create({
      data: {
        sharedFolderId: share.id,
        fileName: `${validFiles.length} selected files`,
        downloadedAt: new Date(),
        ipAddress: userIp,
      },
    })
  } catch (err) {
    console.error('Failed to log download stat:', err)
  }

  return event.node.res
})
