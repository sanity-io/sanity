import {type Node} from '@sanity/comlink'
import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'

export interface ComlinkStore {
  node?: Node<FrameMessages, WindowMessages>
  /**
   * Starts the node the first time it is called; later calls do nothing. Rendering must not start
   * it: `useComlinkStore` calls this from an effect, so a render React abandons never leaves a
   * started node behind. Messages posted before the start are queued by the node until then.
   */
  start: () => void
}
