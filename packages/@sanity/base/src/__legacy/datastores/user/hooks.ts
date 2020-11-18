import userStore from 'part:@sanity/base/user'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {User} from './types'

export function useUser(userId: string): LoadableState<User> {
  return useLoadable(userStore.observable.getUser(userId))
}
