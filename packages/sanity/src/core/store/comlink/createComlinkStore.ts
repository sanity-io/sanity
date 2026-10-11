import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'
import {createSanityInstance} from '@sanity/sdk'
import {getNodeState, getOrCreateNode} from '@sanity/sdk/comlink'
import {type Subscription} from 'rxjs'

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

const SDK_NODE = {name: SDK_NODE_NAME, connectTo: SDK_CHANNEL_NAME}

function noop() {}

/**
 * Shares the SDK's Comlink node: a second node with its name would handle every message twice.
 *
 * @internal
 */
export function createComlinkStore({capabilities}: Options): ComlinkStore {
  if (!capabilities.comlink) {
    return {start: noop}
  }

  // Never disposed, so the SDK keeps its node for the lifetime of the page.
  const instance = createSanityInstance()
  const node = getOrCreateNode<FrameMessages, WindowMessages>(instance, SDK_NODE)
  let subscription: Subscription | undefined

  return {
    node,
    start: () => {
      subscription ??= getNodeState(instance, SDK_NODE).observable.subscribe()
    },
  }
}
