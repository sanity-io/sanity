declare const _default: {
  actions: {
    logout: () => Promise<null>
    retry: () => Promise<import('./types').CurrentUser>
  }
  currentUser: import('rxjs').Observable<import('./types').CurrentUserEvent>
  getUser: (userId: string) => Promise<import('./types').User>
  getUsers: (ids: string[]) => Promise<import('./types').User[]>
  observable: {
    currentUser: import('rxjs').Observable<import('./types').CurrentUserEvent>
    getUser: (userId: string) => import('rxjs').Observable<import('./types').User>
    getUsers: (userIds: string[]) => import('rxjs').Observable<import('./types').User[]>
  }
}
export default _default
export * from './types'
