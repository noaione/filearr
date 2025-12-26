import { getSessionToken } from '@@/server/utils/session'

export default defineEventHandler(async (event) => {
  const session = await getSessionToken(event)

  if (!session.isLoggedIn) {
    return { isLoggedIn: false }
  }

  return {
    isLoggedIn: true,
    user: {
      id: session.userId,
      username: session.username,
    },
  }
})
