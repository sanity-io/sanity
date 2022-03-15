import {useMemo} from 'react'
import {CurrentUser, User} from '@sanity/types'
import {LoadableState, useLoadable} from '../../util/useLoadable'
import {useDatastores} from '../useDatastores'

export function useUser(userId: string): LoadableState<User | null> {
  const {userStore} = useDatastores()
  const user$ = useMemo(() => userStore.observable.getUser(userId), [userId, userStore])

  return useLoadable(user$, null)
}

export function useCurrentUser(): LoadableState<CurrentUser | null> {
  const {userStore} = useDatastores()

  return useLoadable(userStore.me, null)
}
