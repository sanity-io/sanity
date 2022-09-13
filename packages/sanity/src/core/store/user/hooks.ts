import {CurrentUser, User} from '@sanity/types'
import {from} from 'rxjs'
import {useSource} from '../../studio'
import {UserStore, useUserStore} from '../_legacy'
import {createHookFromObservableFactory, LoadingTuple} from '../../util'

const useUserViaUserStore = createHookFromObservableFactory(
  (userStore: UserStore, userId: string) => from(userStore.getUser(userId))
)

export function useUser(userId: string): LoadingTuple<User | null | undefined> {
  const userStore = useUserStore()
  return useUserViaUserStore(userStore, userId)
}

export function useCurrentUser(): CurrentUser | null {
  const {currentUser} = useSource()
  return currentUser
}
