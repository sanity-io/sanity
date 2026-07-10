import {useDocumentPane} from '../panes/document/useDocumentPane'

/**
 * Returns true when a variant is selected and the open document's variant-scoped version for the
 * current bundle has resolved (i.e. the user is editing a variant document).
 *
 * Temporary hook used by the document pane UI to hide actions while editing variant documents.
 * Intended for internal use and can be removed once actions are supported on variant documents.
 */
export function useIsEditingVariantDocument(): boolean {
  const {targetDocumentState} = useDocumentPane()

  return targetDocumentState.status === 'ready' && targetDocumentState.variant !== undefined
}
