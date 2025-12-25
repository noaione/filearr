import { createReadStream } from 'fs'
import { join, basename } from 'path'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo, signFilePath } from '@@/server/utils/files'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const filePath = query.path as string
  const signature = query.sig as string
  const expiryTime = query.exp as string

  if (!token || !filePath || !signature || !expiryTime) {
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
  const requestedPath = sanitizePath(join(share.path, filePath), filesDir)

  // Ensure requested path is within share path
  if (!requestedPath.startsWith(sharePath)) {
    throw createError({
      statusCode: 403,
      message: 'Access denied',
    })
  }

  // Verify signature
  if (!verifyFileSignature(filePath, token, signature, parsedExpiry)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid signature',
    })
  }

  const info = await getFileInfo(requestedPath)

  if (!info.isFile) {
    throw createError({
      statusCode: 400,
      message: 'Path must be a file',
    })
  }

  // Log download
  const headers = getHeaders(event)
  await prisma.downloadStat.create({
    data: {
      sharedFolderId: share.id,
      fileName: filePath,
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: headers['user-agent'] || 'unknown',
    },
  })

  // Stream the file
  const stream = createReadStream(requestedPath)
  const fileName = basename(requestedPath)

  setResponseHeaders(event, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    'Content-Length': info.size.toString(),
  })

  return sendStream(event, stream)
})
