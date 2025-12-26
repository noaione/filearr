import { createReadStream } from 'fs'
import { basename } from 'path'
import prisma from '@@/server/utils/db'
import { sanitizePath, getFilesDirectory, getFileInfo, verifyFileSignature } from '@@/server/utils/files'
import { getUserIpAddress } from '~~/server/utils/ips'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const signature = query.sig as string
  const expiryTime = query.exp as string

  if (!token || !signature || !expiryTime) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameters',
    })
  }

  const parsedExpiry = Number.parseInt(expiryTime, 10)
  if (Number.isNaN(parsedExpiry)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid expiry time',
    })
  }

  const share = await prisma.sharedFile.findUnique({
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
  const filePath = sanitizePath(share.path, filesDir)

  // Verify signature
  if (!verifyFileSignature(share.path, token, signature, parsedExpiry)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid signature',
    })
  }

  const info = await getFileInfo(filePath)

  if (!info.isFile) {
    throw createError({
      statusCode: 400,
      message: 'Path must be a file',
    })
  }

  // Log download
  const headers = getHeaders(event)
  await prisma.fileDownloadStat.create({
    data: {
      sharedFileId: share.id,
      ipAddress: getUserIpAddress(event) || 'unknown',
      userAgent: headers['user-agent'] || 'unknown',
    },
  })

  // Stream the file
  const stream = createReadStream(filePath)
  const fileName = basename(filePath)

  setResponseHeaders(event, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    'Content-Length': info.size.toString(),
  })

  return sendStream(event, stream)
})
