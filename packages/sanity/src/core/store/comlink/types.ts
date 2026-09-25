import {type Node} from '@sanity/comlink'
import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'

export interface ComlinkStore {
  node?: Node<FrameMessages, WindowMessages>
  /**
   * Holds on to the node the first time it is called, so the SDK doesn't release it; later calls do
   * nothing. `useComlinkStore` calls this from an effect, once a consumer has committed.
   */
  start: () => void
}
