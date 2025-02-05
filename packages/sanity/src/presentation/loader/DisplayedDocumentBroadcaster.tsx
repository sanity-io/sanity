/**
 * Report back up the document state being displayed in the document pane,
 * allowing Presentation Tool to patch the live queries with the same state.
 * This makes the Perspective switcher less confusing, as it applies to everything else on the page.
 * It's also why it's possible to select an older revision and see it in the preview,
 * effectively letting you preview a revert action you might be considering to perform.
 */

import isEqual from 'fast-deep-equal'
import {type PropsWithChildren, useCallback, useContext, useEffect} from 'react'
import {type SanityDocument} from 'sanity'
import {PresentationDisplayedDocumentContext} from 'sanity/_singletons'

import {type PresentationDisplayedDocumentContextValue} from './types'

export interface DisplayedDocumentBroadcasterProps extends PropsWithChildren {
  setDisplayedDocument: React.Dispatch<
    React.SetStateAction<Partial<SanityDocument> | null | undefined>
  >
  documentId: string | null | undefined
}

export function DisplayedDocumentBroadcasterProvider(
  props: DisplayedDocumentBroadcasterProps,
): React.JSX.Element {
  const {children, setDisplayedDocument, documentId} = props

  const context = useCallback<PresentationDisplayedDocumentContextValue>(
    (next) => setDisplayedDocument((prev) => (isEqual(prev, next) ? prev : next)),
    [setDisplayedDocument],
  )

  useEffect(() => {
    // If no document is currently being displayed then reset the state
    if (documentId) {
      return undefined
    }
    const timeout = setTimeout(() => setDisplayedDocument(null))
    return () => clearTimeout(timeout)
  }, [documentId, setDisplayedDocument])

  return (
    <PresentationDisplayedDocumentContext.Provider value={context}>
      {children}
    </PresentationDisplayedDocumentContext.Provider>
  )
}

export function useDisplayedDocumentBroadcaster(): PresentationDisplayedDocumentContextValue | null {
  return useContext(PresentationDisplayedDocumentContext)
}
