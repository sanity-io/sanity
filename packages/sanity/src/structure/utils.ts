import {LOADING_PANE} from './constants'
import {type DocumentPaneNode, type PaneNode} from './types'

export function isDocumentPaneNode(pane: PaneNode | typeof LOADING_PANE): pane is DocumentPaneNode {
  return pane !== LOADING_PANE && pane.type === 'document'
}
