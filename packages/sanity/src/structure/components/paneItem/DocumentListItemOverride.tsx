import {createContext, type ReactNode, useContext} from 'react'
import {type DocumentPresence} from 'sanity'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * An extension point on a document list row: what fills the row's status area (right of the title) and the
 * hover tooltip. Today `PaneItemPreview` hard-codes `DocumentVersionsStatusIndicator` and
 * `DocumentVersionsStatus`. The Variants 2.0 C3 designs (a versions control and a popover on every row) need
 * to replace both, with the stock row as the fallback.
 *
 * It is a hook, not a component, so the host can decide per row between its own UI and `undefined`
 * (= unchanged), and read the stock `defaultStatus` it is replacing. The default implementation returns
 * `undefined`, so Studio is unchanged unless a provider is mounted.
 *
 * @internal
 */
export interface DocumentListItemOverrideArgs {
  /** The published id of the document group. */
  documentId: string
  documentType: string
  presence?: DocumentPresence[]
  /** What stock Studio renders in the status area (presence and the version indicator). */
  defaultStatus: ReactNode
}

/** @internal */
export interface DocumentListItemOverride {
  status: ReactNode
  /** Replaces the hover tooltip; `null` removes it. */
  tooltip: ReactNode
}

/** @internal */
export type UseDocumentListItemOverride = (
  args: DocumentListItemOverrideArgs,
) => DocumentListItemOverride | undefined

const noOverride: UseDocumentListItemOverride = () => undefined

const DocumentListItemOverrideContext = createContext<UseDocumentListItemOverride>(noOverride)

/** @internal Provide a hook (a stable function) to override document list rows. */
export const DocumentListItemOverrideProvider = DocumentListItemOverrideContext.Provider

/** @internal */
export function useDocumentListItemOverride(
  args: DocumentListItemOverrideArgs,
): DocumentListItemOverride | undefined {
  // The context value is a stable hook supplied once by the host, so calling it here keeps the hook order.
  const useOverride = useContext(DocumentListItemOverrideContext)
  return useOverride(args)
}
