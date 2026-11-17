import {type StudioLocaleResourceKeys} from '../../i18n/bundles/studio'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isPublishedVersion} from '../../util/versionsUtils'

type DocumentVersionStatusTimestampKey = Extract<
  StudioLocaleResourceKeys,
  'document-status.edited' | 'document-status.published-at'
>

/**
 * Relative-time label for a document version in the versions status popover.
 *
 * Published (non-live-edit) versions use "Published". Everything else uses "Edited", since a
 * live-edit document is published by editing it.
 *
 * @internal
 */
export function getDocumentVersionStatusTimestampKey(
  version: VersionInfoDocumentStub,
  liveEdit: boolean,
): DocumentVersionStatusTimestampKey {
  return isPublishedVersion(version) && !liveEdit
    ? 'document-status.published-at'
    : 'document-status.edited'
}
