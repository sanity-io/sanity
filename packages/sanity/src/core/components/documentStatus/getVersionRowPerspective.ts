import {type ReleaseId} from '../../perspective/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getVersionFromId, type SystemBundle} from '../../util/draftUtils'
import {readVersionType} from '../../util/versionsUtils'
import {type DocumentVersionStatusItem} from './sortDocumentVersionsForStatus'

/**
 * The perspective a version row of the versions flyout opens: `published`, `drafts`, or the id
 * of the release the version is in.
 *
 * @internal
 */
export function getVersionRowPerspective(
  item: DocumentVersionStatusItem,
): SystemBundle | ReleaseId {
  switch (readVersionType(item.version)) {
    case 'published':
      return 'published'
    case 'draft':
      return 'drafts'
    default:
      return item.release
        ? getReleaseIdFromReleaseDocumentId(item.release._id)
        : ((item.version._system.bundleId ?? getVersionFromId(item.version._id)) as ReleaseId)
  }
}
