declare module 'part:*'
declare module 'all:part:*'
declare module 'part:@sanity/base/client' {
  const client: import('@sanity/client').SanityClient
  export default client
}

declare module 'part:@sanity/base/user' {
  import {Observable} from 'rxjs'

  export interface User {
    id: string
    displayName?: string
    imageUrl?: string
  }

  export interface CurrentUser {
    id: string
    name: string
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

  export interface UserStore {
    currentUser: Observable<CurrentUserEvent>
    getUser: (userId: string) => Promise<User>
    getUsers: (userIds: string[]) => Promise<User[]>
    actions: {
      logout: () => Observable<null>
      retry: () => Observable<CurrentUser>
    }
    observable: {
      currentUser: Observable<CurrentUserEvent>
      getUser: (userId: string) => Observable<User>
      getUsers: (userIds: string[]) => Observable<User[]>
    }
  }

  const userStore: UserStore
  export default userStore
}
