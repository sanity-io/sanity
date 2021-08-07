import {Observable} from 'rxjs'
import {UserColorHue, UserColorManager, UserColor} from './types'
export interface UserColorManagerOptions {
  anonymousColor?: UserColor
  userStore?: {
    currentUser: Observable<{
      type: 'snapshot' | 'error'
      user?: {
        id: string
      } | null
    }>
  }
  colors?: Readonly<Record<UserColorHue, UserColor>>
  currentUserColor?: UserColorHue
}
export declare function createUserColorManager(options?: UserColorManagerOptions): UserColorManager
