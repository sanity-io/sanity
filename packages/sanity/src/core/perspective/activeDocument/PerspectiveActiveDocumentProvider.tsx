import debounce from 'lodash-es/debounce.js'
import {type ReactNode, useMemo, useState} from 'react'
import {PerspectiveActiveDocumentContext} from 'sanity/_singletons'

import {type ActiveDocument, type PerspectiveActiveDocumentContextValue} from './types'

/**
 * Debounced so that navigating between documents does not publish the
 * intermediate `null` from the outgoing pane's cleanup: the queued `null` and
 * the incoming document's value land in the same window, and only the last call
 * survives.
 *
 * Kept far shorter than the equivalent in `TasksProvider` (1000ms). These
 * dropdowns must reflect the current selection when the user opens them, so a
 * second of lag would be visible as a stale menu.
 */
const SET_ACTIVE_DOCUMENT_DEBOUNCE_MS = 150

interface PerspectiveActiveDocumentProviderProps {
  children: ReactNode
}

/**
 * Publishes the selected document to the perspective bar's dropdowns, which live
 * in the navbar — above the tools, and therefore outside the reach of
 * `useDocumentPane`, `usePaneRouter` and `ResolvedPanesContext`.
 *
 * Mount this above both the navbar and the active tool, i.e. from a
 * `studio.components.layout` override.
 *
 * @internal
 */
export function PerspectiveActiveDocumentProvider(
  props: PerspectiveActiveDocumentProviderProps,
): React.JSX.Element {
  const {children} = props
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null)

  const debouncedSetActiveDocument = useMemo(
    () => debounce(setActiveDocument, SET_ACTIVE_DOCUMENT_DEBOUNCE_MS),
    [],
  )

  const value: PerspectiveActiveDocumentContextValue = useMemo(
    () => ({activeDocument, setActiveDocument: debouncedSetActiveDocument}),
    [activeDocument, debouncedSetActiveDocument],
  )

  return (
    <PerspectiveActiveDocumentContext.Provider value={value}>
      {children}
    </PerspectiveActiveDocumentContext.Provider>
  )
}
