import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSession } from '@@/server/utils/session'
import { generateShareToken, sanitizePath, getFilesDirectory, getFileInfo } from '@@/server/utils/files'
import { hashPassword } from '@@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  event.context.session = session
  requireAuth(event)

  const { name, path, password, expiresAt } = await readBody(event)

  if (!name || !path) {
    throw createError({
      statusCode: 400,
      message: 'Name and path are required',
    })
  }

  // Validate path exists
  const filesDir = getFilesDirectory()
  const absolutePath = sanitizePath(path, filesDir)
  await getFileInfo(absolutePath) // This will throw if path doesn't exist

  // Generate unique share token
  const shareToken = generateShareToken()

  // Hash password if provided
  const hashedPassword = password ? await hashPassword(password) : null

  // Create share
  const share = await prisma.sharedFolder.create({
    data: {
      name,
      path,
      shareToken,
      password: hashedPassword,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return share
})
