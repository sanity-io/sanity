import {useMemo} from 'react'
import {CurrentUser, User} from '@sanity/types'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {useSource} from '../../studio'

export function useUser(userId: string): LoadableState<User | null> {
  const {userStore} = useSource().__internal

  const user$ = useMemo(() => userStore.observable.getUser(userId), [userId, userStore])

  return useLoadable(user$, null)
}

export function useCurrentUser(): CurrentUser {
  const {currentUser} = useSource()
  return currentUser
}
