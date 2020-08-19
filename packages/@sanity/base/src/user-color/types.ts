import {Observable} from 'rxjs'

// For better readability
export type UserColorHue = string
export type HexColor = string

export type UserColor = Readonly<{
  background: HexColor
  text: HexColor
  border: HexColor
}>

export interface UserColorManager {
  get: (userId: string) => UserColor
  listen: (userId: string) => Observable<UserColor>
}

export interface ManagerOptions {
  userStore?: {currentUser: Observable<{type: 'snapshot' | 'error'; user: {id: string} | null}>}
  colors: Readonly<Record<UserColorHue, UserColor>>
  currentUserColor: UserColorHue
}
