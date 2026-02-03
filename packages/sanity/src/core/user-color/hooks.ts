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
  return useObservable(observable, manager.get(null))
}
