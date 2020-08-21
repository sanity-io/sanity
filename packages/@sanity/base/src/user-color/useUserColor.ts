import {of} from 'rxjs'
import {useObservable} from '../util/useObservable'
import {useUserColorManager} from './provider'
import {UserColor} from './types'

export function useUserColor(userId: string | null): UserColor | null {
  const manager = useUserColorManager()
  return useObservable(userId === null ? of(null) : manager.listen(userId))
}
