import userStore from 'part:@sanity/base/user'

import {useMemo} from 'react'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {CurrentUser, User} from './types'

export function useUser(userId: string): LoadableState<User | undefined> {
  return useLoadable(useMemo(() => userStore.observable.getUser(userId), [userId]))
}

export function useCurrentUser(): LoadableState<CurrentUser | undefined> {
  return useLoadable(userStore.me)
}
