import {User} from '../user'

export type Status = 'online' | 'editing' | 'inactive'
export type PathElement = string | number | {_key: string}

// Low level data/transport format
export interface Session {
  sessionId: string
  userId: string
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}

// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  lastActiveAt: LastActiveAt
  path: PathElement[]
}

export interface UserSessionPair {
  user: User
  session: Session
}
type LastActiveAt = string // iso date

// These are the data prepared and made ready for different types of UI components to use
// Presence data prepared for a single document
export interface DocumentPresence {
  user: User
  path: PathElement[]
  lastActiveAt: LastActiveAt
}

export {User}

export type GlobalPresence = {
  user: User
  status: Status
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}
