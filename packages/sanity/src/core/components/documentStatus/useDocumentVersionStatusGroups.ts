import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useReleasesEnabled} from '../../releases/hooks/useReleasesEnabled'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {useWorkspace} from '../../studio/workspace'
import {getVersionFromId} from '../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {
  type DocumentVersionStatusGroup,
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
  SHOW_AGENT_VERSIONS_IN_STATUS,
} from './sortDocumentVersionsForStatus'

const editedAt = (item: DocumentVersionStatusItem) => Date.parse(item.version._updatedAt) || 0

/** @internal */
export function latestEdit(group: DocumentVersionStatusGroup): DocumentVersionStatusItem {
  return group.items.reduce((latest, item) => (editedAt(item) > editedAt(latest) ? item : latest))
}

/**
 * The audience lines of a document's versions: the default one first, then the others by their
 * latest edit. With Content Releases off, versions in a release are left out.
 *
 * @internal
 */
export function useDocumentVersionStatusGroups(
  documentGroupId: string,
  options: {
    /** Group by variant whatever the workspace says, for a caller that only renders with variants on. */
    variantsEnabled?: boolean
  } = {},
): {
  groups: DocumentVersionStatusGroup[]
  loading: boolean
} {
  const {byId: releasesById} = useActiveReleases()
  const {byId: variantsById, loading: variantsLoading} = useAllVariants()
  const {loading, versions: allVersions} = useDocumentVersions({documentId: documentGroupId})
  const workspaceVariantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const variantsEnabled = options.variantsEnabled ?? workspaceVariantsEnabled
  const releasesEnabled = useReleasesEnabled()

  const groups = useMemo(() => {
    // With content releases off, versions in a release are left out, as the navbar leaves out the
    // releases. Scheduled drafts stay.
    const versions = releasesEnabled
      ? allVersions
      : allVersions.filter((version) => !isInHiddenRelease(version, releasesById))
    const allGroups = groupDocumentVersionsForStatus(versions, releasesById, variantsById, {
      variantsEnabled,
      showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
    })
    const audiences = allGroups
      .filter((group) => group.variantId)
      .toSorted((left, right) => editedAt(latestEdit(right)) - editedAt(latestEdit(left)))
    return [...allGroups.filter((group) => !group.variantId), ...audiences]
  }, [allVersions, releasesById, releasesEnabled, variantsById, variantsEnabled])

  return {groups, loading: loading || variantsLoading}
}

/** Whether a version belongs to a release (not a scheduled draft) that the studio knows of. */
function isInHiddenRelease(
  version: VersionInfoDocumentStub,
  releasesById: Map<string, ReleaseDocument>,
): boolean {
  const releaseRef =
    version._system.release?._ref ??
    (getDocumentVersionVariantId(version) ? undefined : getVersionFromId(version._id))
  if (!releaseRef) return false
  const release =
    releasesById.get(releaseRef) ?? releasesById.get(getReleaseDocumentIdFromReleaseId(releaseRef))
  return release !== undefined && !isCardinalityOneRelease(release)
}
