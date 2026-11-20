/**
 * Where the focus is in a document pane: the path of the field and, in a Portable Text editor,
 * the selection. The pane reports it to presence; the editor sets it on selection changes.
 */
import {createContext, use} from 'react'

import {type Path} from '../paths'
import {type Json} from '../util'

export interface PaneFocus {
  path: Path
  selection?: Json
}

export const PaneFocusContext = createContext<((focus: PaneFocus) => void) | null>(null)

export function usePaneFocus(): ((focus: PaneFocus) => void) | null {
  return use(PaneFocusContext)
}
