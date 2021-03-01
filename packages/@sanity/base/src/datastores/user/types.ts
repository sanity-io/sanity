import createUserStore from './createUserStore'

export interface CurrentUser {
  id: string
  name: string
  email: string
  profileImage?: string
  role: string
}

export interface CurrentUserError {
  type: 'error'
  error: Error
}

export interface CurrentUserSnapshot {
  type: 'snapshot'
  user: CurrentUser | null
}

export type CurrentUserEvent = CurrentUserError | CurrentUserSnapshot

export interface User {
  id: string
  displayName?: string
  imageUrl?: string
}

export type UserStore = ReturnType<typeof createUserStore>
