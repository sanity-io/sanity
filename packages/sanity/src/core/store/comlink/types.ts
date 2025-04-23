import {type Node} from '@sanity/comlink'
import {type FrameMessages, type WindowMessages} from '@sanity/message-protocol'

export interface ComlinkStore {
  node?: Node<FrameMessages, WindowMessages>
}
