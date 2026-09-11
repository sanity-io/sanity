import {createNode} from '@sanity/comlink'
import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'

import {type CapabilityRecord} from '../renderingContext/types'
import {type ComlinkStore} from './types'

interface Options {
  capabilities: CapabilityRecord
}

// These values must match the bindings of the same name exported by `@sanity/message-protocol`.
// We are currently unable to consume this package at runtime because of ESM issues.
//
// TODO: Consume `SDK_CHANNEL_NAME` and `SDK_NODE_NAME` from `@sanity/message-protocol`.
const SDK_CHANNEL_NAME = 'dashboard/channels/sdk'
const SDK_NODE_NAME = 'dashboard/nodes/sdk'

function noop() {}

/**
 * Create a Comlink node if Comlink is provided by the Studio rendering context. The node is not
 * started here — the store is created during render — but by the first `start()` call, which
 * `useComlinkStore` makes once the consumer has committed.
 *
 * @internal
 */
export function createComlinkStore({capabilities}: Options): ComlinkStore {
  if (!capabilities.comlink) {
    return {start: noop}
  }

  const node = createNode<FrameMessages, WindowMessages>({
    name: SDK_NODE_NAME,
    connectTo: SDK_CHANNEL_NAME,
  })

  let started = false

  return {
    node,
    start: () => {
      if (started) return
      started = true
      node.start()
    },
  }
}
