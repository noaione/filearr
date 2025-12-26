import { getSessionToken } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)
  session.destroy()

  return { success: true }
})
