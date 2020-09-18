import {useContext} from 'react'
import {empty} from 'rxjs'
import {useObservable} from '../util/useObservable'
import {UserColorManagerContext} from './context'
import {UserColor, UserColorManager} from './types'

export function useUserColorManager(): UserColorManager {
  return useContext(UserColorManagerContext)
}

export function useUserColor(userId: string | null): UserColor {
  const manager = useUserColorManager()

  return useObservable(userId ? manager.listen(userId) : empty(), manager.get(null))
}
