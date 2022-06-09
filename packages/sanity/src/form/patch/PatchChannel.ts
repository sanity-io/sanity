import {FormPatch} from './types'

/**
 * @internal
 */
export interface MutationPatchMsg {
  type: 'mutation'
  patches: FormPatch[]
  snapshot: unknown
}

/**
 * @internal
 */
export interface RebasePatchMsg {
  type: 'rebase'
  patches: FormPatch[]
  snapshot: unknown
}

/**
 * @internal
 */
export type PatchMsg = MutationPatchMsg | RebasePatchMsg

/**
 * @internal
 */
export interface PatchMsgSubscriber {
  (msg: PatchMsg): void
}

/**
 * @internal
 */
export interface PatchChannel {
  publish: (msg: PatchMsg) => void
  subscribe: (subscriber: PatchMsgSubscriber) => () => void
}

/**
 * @internal
 */
export function createPatchChannel(): PatchChannel {
  const _subscribers: PatchMsgSubscriber[] = []

  return {
    publish(msg: PatchMsg) {
      for (const subscriber of _subscribers) {
        subscriber(msg)
      }
    },

    subscribe(subscriber) {
      _subscribers.push(subscriber)

      return () => {
        const idx = _subscribers.indexOf(subscriber)

        if (idx > -1) {
          _subscribers.splice(idx, 1)
        }
      }
    },
  }
}
