import {useUserColorManager} from '@sanity/base/user-color'
import {useObservable} from './utils/useObservable'

export function useUserColor(userId: string | null): string | null {
  const manager = useUserColorManager()
  return userId ? useObservable(manager.listen(userId)) : null
}
