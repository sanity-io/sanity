// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import userStore from 'part:@sanity/base/user'

import {useMemo} from 'react'
import type {CurrentUser, User} from '@sanity/types'
import type {LoadableState} from '../../util/useLoadable'
import {useLoadable} from '../../util/useLoadable'

export function useUser(userId: string): LoadableState<User | undefined> {
  return useLoadable(useMemo(() => userStore.observable.getUser(userId), [userId]))
}

export function useCurrentUser(): LoadableState<CurrentUser | undefined> {
  return useLoadable(userStore.me)
}
