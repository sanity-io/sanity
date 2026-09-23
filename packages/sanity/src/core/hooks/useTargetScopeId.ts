import {useMemo} from 'react'

import {type ReleaseId} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {useDocumentVersions} from '../releases/hooks/useDocumentVersions'
import {useDocumentVersionTypeSortedList} from '../releases/hooks/useDocumentVersionTypeSortedList'
import {useOnlyHasVersions} from '../releases/hooks/useOnlyHasVersions'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {getVersionFromId, isSystemBundle} from '../util/draftUtils'
import {getTargetScopeId, useTargetDocumentState} from './useTargetDocumentState'

/**
 * @internal
 */
export interface TargetScopeIdOptions {
  /** The document group id (published id) the pair is checked out for. */
  documentId: string
  /**
   * The perspective the consumer is displaying, which is not necessarily the
   * globally selected one (e.g. a diff view pane pins its own).
   */
  selectedPerspectiveName?: ReleaseId | 'published'
}

/**
 * The bundle segment for the pair checkout (`useEditState` & co.) of a document
 * group under the given perspective.
 *
 * Variant targets use the stub-resolved opaque scope id exclusively: a
 * missing/unresolved variant target must never fall back to another document
 * (ops stay guarded, the form stays read-only). Non-variant targets keep the
 * deterministic release derivation with its fallbacks — a release version id is
 * derivable, so new documents under a release must check out the version pair
 * for typing to create the release version (not the base draft), and documents
 * that only have versions must check out their first version to display it.
 *
 * @internal
 */
export function useTargetScopeId(options: TargetScopeIdOptions): string | undefined {
  const {documentId, selectedPerspectiveName} = options

  const {data: documentVersions} = useDocumentVersions({documentId})
  const {selectedVariantName} = usePerspective()
  const targetDocumentState = useTargetDocumentState(documentId)
  const onlyHasVersions = useOnlyHasVersions({documentId})

  // if it only has versions then we need to make sure that whatever the first
  // document that is allowed is a version document, but also that it has the
  // right order this will make sure that then the right document appears and so
  // does the right chip within the document header
  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId})
  const firstVersion =
    sortedDocumentList.length > 0
      ? documentVersions.find(
          (id) =>
            getVersionFromId(id) === getReleaseIdFromReleaseDocumentId(sortedDocumentList[0]._id),
        )
      : undefined

  return useMemo(() => {
    if (selectedVariantName) {
      // The scope of the resolved target document (release id for release
      // targets, opaque scope hash for variant targets), threaded through the
      // version-editing pipeline. Undefined while the target is resolving or
      // when the base draft/published pair applies.
      return getTargetScopeId(targetDocumentState)
    }

    if (isSystemBundle(selectedPerspectiveName)) {
      return undefined
    }

    // if a document version exists with the selected release id, then it should
    // use that
    if (documentVersions.some((id) => getVersionFromId(id) === selectedPerspectiveName)) {
      return selectedPerspectiveName
    }

    // check if the selected version is the only version, if it isn't and it
    // doesn't exist in the release then it needs to use the documentVersions
    if (selectedPerspectiveName && (!documentVersions.length || !onlyHasVersions)) {
      return selectedPerspectiveName
    }

    return getVersionFromId(firstVersion ?? '')
  }, [
    selectedVariantName,
    targetDocumentState,
    documentVersions,
    onlyHasVersions,
    selectedPerspectiveName,
    firstVersion,
  ])
}
