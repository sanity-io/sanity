// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import userStore from 'part:@sanity/base/user'

import {useMemo} from 'react'
import {CurrentUser, User} from '@sanity/types'
import {LoadableState, useLoadable} from '../../util/useLoadable'

export function useUser(userId: string): LoadableState<User | undefined> {
  return useLoadable(useMemo(() => userStore.observable.getUser(userId), [userId]))
}

export function useCurrentUser(): LoadableState<CurrentUser | undefined> {
  return useLoadable(userStore.me)
}
