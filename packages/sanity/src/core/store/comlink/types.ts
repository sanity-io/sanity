import {type Node} from '@sanity/comlink'
import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'

export interface ComlinkStore {
  node?: Node<FrameMessages, WindowMessages>
  /** Idempotent. Call it from an effect: a render React abandons must not leave the node held. */
  start: () => void
}
