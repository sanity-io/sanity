import {type HookCollectionActionHook} from './types'

const actionIds = new WeakMap<HookCollectionActionHook<any, any>, string>()

let counter = 0

/** @internal */
export function getHookId<T, K>(actionHook: HookCollectionActionHook<T, K>): string {
  const cachedId = actionIds.get(actionHook)

  if (cachedId) return cachedId

  const id = `${actionHook.name || (actionHook as any).displayName || '<anonymous>'}-${counter++}`

  actionIds.set(actionHook, id)

  return id
}
