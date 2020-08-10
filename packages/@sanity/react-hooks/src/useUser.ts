import userStore from 'part:@sanity/base/user'
import {useObservable} from './utils/use-observable'

export interface User {
  id: string
  displayName?: string
  imageUrl?: string
}

export const LOADING_USER = Symbol.for('LOADING_USER')

export function useUser(userId): User | null | typeof LOADING_USER {
  return useObservable(userStore.observable.getUser(userId))
}
