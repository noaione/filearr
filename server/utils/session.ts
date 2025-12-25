import { getIronSession, type IronSession } from 'iron-session'
import type { H3Event } from 'h3'

export interface SessionData {
  userId?: string
  username?: string
  isLoggedIn: boolean
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'change-me-in-production-please-really-long-secret',
  cookieName: 'filearr_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(event: H3Event): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(
    event.node.req,
    event.node.res,
    sessionOptions
  )
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = false
  }
  
  return session
}
