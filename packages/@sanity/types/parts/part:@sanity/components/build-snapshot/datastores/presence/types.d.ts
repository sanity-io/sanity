import {Path} from '_self_'
import {User} from '../user'
export declare type Status = 'online' | 'editing' | 'inactive'
export interface Session {
  sessionId: string
  userId: string
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}
export interface PresenceLocation {
  type: 'document'
  documentId: string
  lastActiveAt: LastActiveAt
  path: Path
}
export interface UserSessionPair {
  user: User
  session: Session
}
declare type LastActiveAt = string
export interface DocumentPresence {
  user: User
  path: Path
  lastActiveAt: LastActiveAt
}
export {User}
export declare type GlobalPresence = {
  user: User
  status: Status
  lastActiveAt: LastActiveAt
  locations: PresenceLocation[]
}
