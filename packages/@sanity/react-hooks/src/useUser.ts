import userStore from 'part:@sanity/base/user'
import {useLoadable, LoadableState} from './utils/useLoadable'

export interface User {
  id: string
  displayName?: string
  imageUrl?: string
}

export function useUser(userId): LoadableState<User> {
  return useLoadable(userStore.observable.getUser(userId))
}
