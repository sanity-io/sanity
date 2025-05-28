import {type PreviewValue, type SanityDocument, type SchemaType} from '@sanity/types'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {type PerspectiveStack} from '../../perspective/types'
import {getPublishedId, getVersionFromId, isVersionId} from '../../util/draftUtils'
import {type DocumentPreviewStore} from '../documentPreviewStore'

/**
 * @internal
 */
export interface PreviewState {
  isLoading?: boolean
  /**
   * The preview snapshot as seen through the current perspective stack
   */
  snapshot: PreviewValue | Partial<SanityDocument> | null
  /**
   * The preview snapshot in either a single `version` perspective, or the `drafts` perspective
   * This can be used as a fallback if the document exists in e.g. drafts form, but not in the current perspective
   */
  original: PreviewValue | Partial<SanityDocument> | null
}

/**
 * Obtain a document's published and draft state, along with loading status.
 *
 * @internal
 */
export function getPreviewStateObservable(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  perspective?: PerspectiveStack,
): Observable<PreviewState> {
  const perspectiveSnapshot = documentPreviewStore.observeForPreview(
    {_id: getPublishedId(documentId)},
    schemaType,
    {perspective},
  )

  const versionOrDraftId = isVersionId(documentId) ? getVersionFromId(documentId) : 'drafts'

  const preparedVersionSnapshot = versionOrDraftId
    ? documentPreviewStore.observeForPreview({_id: getPublishedId(documentId)}, schemaType, {
        perspective: [versionOrDraftId],
      })
    : of(null)

  return combineLatest([perspectiveSnapshot, preparedVersionSnapshot]).pipe(
    map(([main, version]) => ({
      isLoading: false,
      snapshot: main?.snapshot || null,
      original: version?.snapshot || null,
    })),
    startWith({
      isLoading: true,
      snapshot: null,
      original: null,
    }),
  )
}
