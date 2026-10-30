import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {
  type AgentVersionDisplay,
  DEFAULT_VARIANT_TYPE_KEY,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getVersionFromId,
  getVersionId,
  isPublishedPerspective,
  type TargetPerspective,
  useActiveReleases,
  useAgentVersionDisplay,
  useDocumentVersions,
  usePerspective,
  useWorkspace,
} from 'sanity'

import {isLiveEditEnabled} from '../../../../../../components/paneItem/helpers'
import {usePerspectiveNavigator} from '../../../../../../hooks/usePerspectiveNavigator'
import {useDocumentPane} from '../../../../useDocumentPane'
import {useSelectedVariant} from '../variants/useSelectedVariant'
import {getNavigationBadges} from './getNavigationBadges'

/** @internal */
export interface NavigationBadgeState {
  /** The selected variant has a version in this bundle. */
  active: boolean
  /** This bundle is the global perspective. */
  selected: boolean
}

/** @internal */
export interface NavigationBadges {
  published: NavigationBadgeState
  /** `undefined` when the workspace has no draft model. */
  draft: NavigationBadgeState | undefined
  /** One per active release the selected variant has a version in. */
  releases: {release: ReleaseDocument; selected: boolean}[]
  /** The current user's agent bundle, when the selected variant has a version in it. */
  agent: {bundleId: string; display: AgentVersionDisplay; selected: boolean} | undefined
  /** Changes the global perspective. The selected variant stays as it is. */
  navigate: (perspective: TargetPerspective) => void
}

/**
 * The badges of the document panel navigation. They follow the selected variant (Default when
 * none is selected), and which one is selected follows the global perspective, not the displayed
 * document, whose id is an opaque `versions.*` id once a variant is selected.
 *
 * @internal
 */
export function useNavigationBadges(): NavigationBadges {
  const {documentId, schemaType} = useDocumentPane()
  const {selectedPerspectiveName, selectedReleaseId} = usePerspective()
  const {document} = useWorkspace()
  const selectedVariant = useSelectedVariant(DEFAULT_VARIANT_TYPE_KEY)
  const groupId = getPublishedId(documentId)
  const {versions} = useDocumentVersions({documentId: groupId})
  const {data: activeReleases} = useActiveReleases()
  const {navigate} = usePerspectiveNavigator()

  const variantId = selectedVariant?._id
  const state = useMemo(() => getNavigationBadges({versions, variantId}), [versions, variantId])

  // Agent bundle ownership is resolved from version ids, and variant versions have opaque ids, so
  // ask about the id each bundle would have outside a variant.
  const agentVersionIds = useMemo(
    () => state.agentBundleIds.map((bundleId) => getVersionId(groupId, bundleId)),
    [groupId, state.agentBundleIds],
  )
  const {filteredVersionIds, getVersionDisplay} = useAgentVersionDisplay(
    agentVersionIds,
    selectedPerspectiveName,
  )

  const isLiveEdit = isLiveEditEnabled(schemaType)
  const isDraftModelEnabled = document.drafts.enabled
  const isDraftsPerspective = selectedPerspectiveName === undefined

  const releases = useMemo(
    () =>
      activeReleases
        .filter((release) =>
          state.releaseIds.includes(getReleaseIdFromReleaseDocumentId(release._id)),
        )
        .map((release) => ({
          release,
          selected: getReleaseIdFromReleaseDocumentId(release._id) === selectedReleaseId,
        })),
    [activeReleases, selectedReleaseId, state.releaseIds],
  )

  const agent = useMemo(() => {
    const versionId = filteredVersionIds[0]
    const bundleId = versionId ? getVersionFromId(versionId) : undefined
    const display = versionId ? getVersionDisplay(versionId) : null
    if (!bundleId || !display) return undefined
    return {bundleId, display, selected: selectedPerspectiveName === bundleId}
  }, [filteredVersionIds, getVersionDisplay, selectedPerspectiveName])

  return {
    published: {
      active: state.hasPublished,
      // A live-edit document is edited in place, so the drafts perspective shows it as published.
      selected:
        isPublishedPerspective(selectedPerspectiveName ?? '') ||
        (isLiveEdit && isDraftsPerspective),
    },
    draft:
      isDraftModelEnabled || (isLiveEdit && state.hasDraft)
        ? {active: state.hasDraft, selected: isDraftsPerspective && !isLiveEdit}
        : undefined,
    releases,
    agent,
    navigate,
  }
}
