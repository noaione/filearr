import prisma from '@@/server/utils/db'
import { requireAuth } from '@@/server/utils/auth'
import { getSessionToken } from '@@/server/utils/session'
import { hashPassword } from '@@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)
  event.context.session = session
  requireAuth(event)

  const id = getRouterParam(event, 'id')
  const { name, password, expiresAt } = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Share ID is required',
    })
  }

  // Check if share exists and is not expired
  const existingShare = await prisma.sharedFolder.findUnique({
    where: { id },
  })

  if (!existingShare) {
    throw createError({
      statusCode: 404,
      message: 'Share not found',
    })
  }

  // Check if expired
  if (existingShare.expiresAt && existingShare.expiresAt < new Date()) {
    throw createError({
      statusCode: 410,
      message: 'Cannot edit expired share',
    })
  }

  // Prepare update data
  const updateData: any = {}
  
  if (name !== undefined) {
    updateData.name = name
  }

  if (password !== undefined) {
    // If password is empty string, remove password protection
    updateData.password = password ? await hashPassword(password) : null
  }

  if (expiresAt !== undefined) {
    updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
  }

  // Update share
  const share = await prisma.sharedFolder.update({
    where: { id },
    data: updateData,
  })

  return share
})
