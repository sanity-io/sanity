import type {Observable} from 'rxjs'

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
  email?: string
}

export interface UserStore {
  actions: {logout: () => void; retry: () => void}
  me: Observable<CurrentUser | null>
  getCurrentUser(): Promise<CurrentUser | null>
  getUser(userId: string): Promise<User | null>
  getUsers: (ids: string[]) => Promise<User[]>

  /** @deprecated use userStore.me instead */
  currentUser: Observable<CurrentUserEvent>

  observable: {
    me: Observable<CurrentUser | null>
    getUser(userId: string): Observable<User | null>
    getCurrentUser(): Observable<CurrentUser | null>
    getUsers(userIds: string[]): Observable<User[]>
    getUsers(userIds: ('me' | string)[]): Observable<(User | CurrentUser)[]>

    /** @deprecated use userStore.me instead */
    currentUser: Observable<CurrentUserEvent>
  }
}
