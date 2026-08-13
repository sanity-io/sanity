import {type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {usePerspective} from '../../perspective/usePerspective'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useSingleDocRelease} from '../context/SingleDocReleaseProvider'

/**
 * Returns a callback that clears the pane-local scheduled draft perspective when
 * the document pane is currently viewing the given release. Used after deleting
 * a scheduled draft so stale release UI is not left visible.
 *
 * Must be used within a document pane (requires `SingleDocReleaseProvider`).
 *
 * @internal
 */
export function useClearScheduledDraftPerspectiveOnDelete(
  release: ReleaseDocument | undefined,
): () => void {
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()
  const {selectedPerspectiveName} = usePerspective()

  return useCallback(() => {
    if (!release) return

    if (selectedPerspectiveName === getReleaseIdFromReleaseDocumentId(release._id)) {
      onSetScheduledDraftPerspective('')
    }
  }, [release, selectedPerspectiveName, onSetScheduledDraftPerspective])
}
