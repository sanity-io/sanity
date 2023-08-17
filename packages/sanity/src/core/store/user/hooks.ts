import {CurrentUser, User} from '@sanity/types'
import {useMemo} from 'react'
import {from} from 'rxjs'
import {useSource} from '../../studio'
import {UserStore, useUserStore} from '../_legacy'
import {createHookFromObservableFactory, LoadingTuple} from '../../util'

const useUserViaUserStore = createHookFromObservableFactory(
  ([userStore, userId]: [UserStore, string]) => {
    return from(
      userStore.getUser(userId).catch((err) => {
        console.error(err)
        return null
      }),
    )
  },
)

/** @internal */
export function useUser(userId: string): LoadingTuple<User | null | undefined> {
  const userStore = useUserStore()
  return useUserViaUserStore(useMemo(() => [userStore, userId], [userId, userStore]))
}

/** @internal */
export function useCurrentUser(): CurrentUser | null {
  const {currentUser} = useSource()
  return currentUser
}
