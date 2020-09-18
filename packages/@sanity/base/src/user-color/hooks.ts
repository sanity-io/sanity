import {useContext} from 'react'
import {of} from 'rxjs'
import {useObservable} from '../util/useObservable'
import {UserColorManagerContext} from './context'
import {UserColor, UserColorManager} from './types'

export function useUserColorManager(): UserColorManager {
  return useContext(UserColorManagerContext)
}

export function useUserColor(userId: string | null): UserColor | null {
  const manager = useUserColorManager()
  return useObservable(userId === null ? of(null) : manager.listen(userId))
}
