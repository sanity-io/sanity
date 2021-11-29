import {useContext} from 'react'
import {empty} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import {UserColorManagerContext} from './context'
import type {UserColor, UserColorManager} from './types'

export function useUserColorManager(): UserColorManager {
  return useContext(UserColorManagerContext)
}

export function useUserColor(userId: string | null): UserColor {
  const manager = useUserColorManager()

  return useMemoObservable(userId ? manager.listen(userId) : empty(), [userId], manager.get(null))
}
