import {Path, User} from '@sanity/types'

export type Status = 'online' | 'editing' | 'inactive'

// Low level data/transport format
export interface Session {
  sessionId: string
  userId: string
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}

// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  lastActiveAt: string // iso date
  path: Path
}

export interface UserSessionPair {
  user: User
  session: Session
}

// These are the data prepared and made ready for different types of UI components to use
// Presence data prepared for a single document
export interface DocumentPresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string // iso date
}

export type GlobalPresence = {
  user: User
  status: Status
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}
