import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {distinctUntilChanged, map} from 'rxjs'

import {
  type DocumentPerspectiveState,
  useDocumentVersionsObservable,
} from '../../releases/hooks/useDocumentVersions'

/**
 * Whether a document group has anything for the document group inventory to manage: its
 * versions have loaded and at least one exists. A deleted document, or one that was never
 * created (an empty singleton), has no versions.
 *
 * @internal
 */
export function hasDocumentGroupInventoryVersions(state: DocumentPerspectiveState): boolean {
  return !state.loading && state.versions.length !== 0
}

/**
 * Whether the document group inventory can be opened for the given document. This is the single
 * predicate behind the "Manage versions" action and every control that opens it, so a control is
 * only offered when the action it targets is mounted.
 *
 * `false` until the group's versions have loaded.
 *
 * @internal
 */
export function useIsDocumentGroupInventoryAvailable(props: {documentId: string}): boolean {
  const versionState = useDocumentVersionsObservable(props)

  return useObservable(
    useMemo(
      () => versionState.pipe(map(hasDocumentGroupInventoryVersions), distinctUntilChanged()),
      [versionState],
    ),
    false,
  )
}
