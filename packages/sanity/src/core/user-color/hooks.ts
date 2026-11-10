import {useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY} from 'rxjs'
import {UserColorManagerContext} from 'sanity/_singletons'

import {type UserColor, type UserColorManager} from './types'

/** @internal */
export function useUserColorManager(): UserColorManager {
  const userColorManager = useContext(UserColorManagerContext)

  if (!userColorManager) {
    throw new Error('UserColorManager: missing context value')
  }

  return userColorManager
}

/** @internal */
export function useUserColor(userId: string | null): UserColor {
  const manager = useUserColorManager()

  const observable = useMemo(() => (userId ? manager.listen(userId) : EMPTY), [manager, userId])
  const color = useObservable(observable, undefined)
  // react-rx subscribes on commit, so until the stream emits the hook renders what the manager
  // assigns synchronously: the same color `listen` goes on to emit, so the first frame has the
  // user's color instead of the anonymous gray. Derived per render rather than passed as the
  // `initialValue`, which react-rx captures once per hook instance and would carry the previous
  // user's color through a change of `userId`, for good once it changes to `null`.
  return color ?? manager.get(userId)
}
