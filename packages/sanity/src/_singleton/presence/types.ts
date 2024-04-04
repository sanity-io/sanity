import {type Path, type User} from '@sanity/types'

/**
 * @hidden
 * @public */
export interface FormNodePresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
}
