import {useUserColorManager, UserColor} from '@sanity/base/user-color'

export function useUserColor(userId: string | null): UserColor | null {
  const manager = useUserColorManager()
  return userId ? manager.get(userId) : null

  // Note: When we implement rebalancing, use the listen interface
  // this currently adds overhead (state/hooks) that we don't need,
  // so for now let's not use it

  // return userId ? useObservable(manager.listen(userId)) : null
}
