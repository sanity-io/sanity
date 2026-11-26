import {type StudioLocaleResourceKeys} from '../../i18n/bundles/studio'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isPublishedVersion} from '../../util/versionsUtils'

type DocumentVersionStatusTimestampKey = Extract<
  StudioLocaleResourceKeys,
  'document-status.created' | 'document-status.edited' | 'document-status.published-at'
>

type GroupedDocumentVersionStatusTimestampKey = Extract<
  DocumentVersionStatusTimestampKey,
  'document-status.edited' | 'document-status.published-at'
>

/**
 * Relative-time label for a document version in the versions status tooltip.
 *
 * Published (non-live-edit) versions always use "Published". Everything else uses "Created"
 * when `_createdAt` matches `_updatedAt`, otherwise "Edited".
 *
 * @internal
 */
export function getDocumentVersionStatusTimestampKey(
  version: VersionInfoDocumentStub,
  liveEdit: boolean,
): DocumentVersionStatusTimestampKey {
  if (isPublishedVersion(version) && !liveEdit) {
    return 'document-status.published-at'
  }

  if (version._createdAt === version._updatedAt) {
    return 'document-status.created'
  }

  return 'document-status.edited'
}

/**
 * Relative-time label for a line of the grouped versions status popover.
 *
 * Published (non-live-edit) versions use "Published". Everything else uses "Edited", since a
 * live-edit document is published by editing it.
 *
 * @internal
 */
export function getGroupedDocumentVersionStatusTimestampKey(
  version: VersionInfoDocumentStub,
  liveEdit: boolean,
): GroupedDocumentVersionStatusTimestampKey {
  return isPublishedVersion(version) && !liveEdit
    ? 'document-status.published-at'
    : 'document-status.edited'
}
