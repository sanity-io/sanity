import {type Node} from '@sanity/comlink'
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
 * Share the SDK's Comlink node when Studio has a host to talk to over Comlink: a second node with
 * the same name would handle every message twice.
 *
 * @internal
 */
export function createComlinkStore({capabilities}: Options): ComlinkStore {
  // `comlink` without `dashboard` is a `core-ui` URL opened outside a frame, with no host.
  if (!capabilities.comlink || !capabilities.dashboard) {
    return {start: noop}
  }

  // Never disposed, so the SDK keeps its node for the lifetime of the page.
  const instance = createSanityInstance()
  // TODO: Drop the cast once the SDK's `getOrCreateNode` takes message type arguments (sanity-io/sdk#1323).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the SDK types its node without message types
  const node = getOrCreateNode(instance, SDK_NODE) as Node<FrameMessages, WindowMessages>
  let subscription: Subscription | undefined

  return {
    node,
    start: () => {
      subscription ??= getNodeState(instance, SDK_NODE).observable.subscribe()
    },
  }
}
