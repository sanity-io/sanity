import {Subscribable} from 'rxjs'

interface Serializable {
  serialize: (...args: never[]) => unknown
}

export const isRecord = (thing: unknown): thing is Record<string, unknown> =>
  !!thing && typeof thing === 'object' && !Array.isArray(thing)

export const isSubscribable = (
  thing: unknown
): thing is Subscribable<unknown> | PromiseLike<unknown> => {
  if (!isRecord(thing)) return false
  return typeof thing.subscribe === 'function' || typeof thing.then === 'function'
}

export const isSerializable = (thing: unknown): thing is Serializable => {
  if (!isRecord(thing)) return false
  return typeof thing.serialize === 'function'
}
