import {Path, User} from '@sanity/types'

/** @internal */
export type Status = 'online' | 'editing' | 'inactive'

/** @internal */
// Low level data/transport format
export interface Session {
  sessionId: string
  userId: string
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}

/** @internal */
// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  lastActiveAt: string // iso date
  path: Path
}

/** @internal */
export interface UserSessionPair {
  user: User
  session: Session
}

/** @internal */
// These are the data prepared and made ready for different types of UI components to use
// Presence data prepared for a single document
export interface DocumentPresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string // iso date
}

/** @internal */
export type GlobalPresence = {
  user: User
  status: Status
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}
