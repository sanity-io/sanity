import {CurrentUser} from '@sanity/types'

export interface CurrentUserError {
  type: 'error'
  error: Error
}

export interface CurrentUserSnapshot {
  type: 'snapshot'
  user: CurrentUser | null
}

export type CurrentUserEvent = CurrentUserError | CurrentUserSnapshot
