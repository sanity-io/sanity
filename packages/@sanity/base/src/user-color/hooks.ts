import {useContext} from 'react'
import {of} from 'rxjs'
import {useObservable} from '../util/useObservable'
import {UserColorManagerContext} from './context'
import {UserColor, UserColorManager} from './types'

export function useUserColorManager(): UserColorManager {
  return useContext(UserColorManagerContext)
}

export function useUserColor(userId: string | null): UserColor {
  const manager = useUserColorManager()

  return useObservable(userId === null ? of(manager.get(null)) : manager.listen(userId))
}
