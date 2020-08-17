import {Observable} from 'rxjs'

export type UserColorHue =
  | 'blue'
  | 'cyan'
  // | 'green'
  | 'yellow'
  | 'orange'
  // | 'red'
  | 'magenta'
  | 'purple'

export interface UserColorManager {
  get: (userId: string) => UserColorHue
  listen: (userId: string) => Observable<UserColorHue>
}

export interface ManagerOptions {
  userStore?: {currentUser: Observable<{type: 'snapshot' | 'error'; user: {id: string} | null}>}
  colors: UserColorHue[]
  currentUserColor: UserColorHue
}
