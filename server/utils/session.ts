import { getIronSession, type IronSession } from 'iron-session'
import type { H3Event } from 'h3'

export interface SessionData {
  userId?: string
  username?: string
  isLoggedIn: boolean
}

export interface ShareSessionData {
  shareId: string
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

export async function getSessionShare(event: H3Event, shareId: string): Promise<IronSession<ShareSessionData>> {
  const session = await getIronSession<ShareSessionData>(
    event.node.req,
    event.node.res,
    {
      ...sessionOptions,
      cookieName: `farr_share_${shareId}`,
    }
  )

  return session
}