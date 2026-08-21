import {type StudioLocaleResourceKeys} from '../../i18n/bundles/studio'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isPublishedVersion} from '../../util/versionsUtils'

type DocumentVersionStatusTimestampKey = Extract<
  StudioLocaleResourceKeys,
  'document-status.created' | 'document-status.edited' | 'document-status.published-at'
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
