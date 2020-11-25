import {Observable} from 'rxjs'
import {User, CurrentUser, CurrentUserEvent} from './types'
declare function fetchInitial(): Promise<CurrentUser>
declare function logout(): Promise<null>
declare function getUser(userId: string): Promise<User | null>
declare function getUsers(ids: string[]): Promise<User[]>
export default function createUserStore(): {
  actions: {
    logout: typeof logout
    retry: typeof fetchInitial
  }
  currentUser: Observable<CurrentUserEvent>
  getUser: typeof getUser
  getUsers: typeof getUsers
  observable: {
    currentUser: Observable<CurrentUserEvent>
    getUser: (userId: string) => Observable<User>
    getUsers: (userIds: string[]) => Observable<User[]>
  }
}
export {}
