import { getSession } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  session.destroy()

  return { success: true }
})
