import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Spinner} from '@sanity/ui'
import {type JSX, type RefObject, useMemo} from 'react'
import {styled} from 'styled-components'
import {Flex, VStack} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {CreateReleaseMenuItem} from '../../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useAgentBundles} from '../../../store/agent/useAgentBundles'
import {useWorkspace} from '../../../studio/workspace'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {getRangePosition, ReleasesMenuItem, type LayerRange} from './ReleasesMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
import {type ScrollElement} from './useScrollIndicatorVisibility'
import {ViewContentReleasesMenuItem} from './ViewContentReleasesMenuItem'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const StickyCard = styled(Card)`
  position: sticky;
  z-index: 2;
  background: var(--card-bg-color);
`

const StickyTopCard = styled(StickyCard)`
  top: 0;
`

const StickyBottomCard = styled(StickyCard)`
  bottom: 0;
`

function matchesPerspectiveFilter(label: string, normalizedQuery: string): boolean {
  return label.toLowerCase().includes(normalizedQuery)
}

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  isRangeVisible,
  selectedPerspectiveName,
  handleOpenBundleDialog,
  scrollElementRef,
  menuItemProps,
  filterQuery = '',
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLElement | null) => void
  isRangeVisible: boolean
  selectedPerspectiveName: string | undefined
  handleOpenBundleDialog: () => void
  scrollElementRef: RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  filterQuery?: string
}): JSX.Element {
  const {t} = useTranslation()
  const {loading, data: allReleases} = useActiveReleases()
  const {bundles: agentBundles} = useAgentBundles()
  const normalizedQuery = filterQuery.trim().toLowerCase()
  const isFiltering = normalizedQuery.length > 0

  const releases = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const untitledRelease = t('release.placeholder-untitled-release')
  const visibleReleases = useMemo(() => {
    if (!isFiltering) return releases

    return releases.filter((release) =>
      matchesPerspectiveFilter(release.metadata?.title || untitledRelease, normalizedQuery),
    )
  }, [isFiltering, normalizedQuery, releases, untitledRelease])

  const sortedReleaseTypeReleases = useMemo(
    () =>
      orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
        (ReleaseTypeReleases, releaseType) => ({
          ...ReleaseTypeReleases,
          [releaseType]: visibleReleases.filter(
            ({metadata}) => metadata.releaseType === releaseType,
          ),
        }),
        {} as Record<ReleaseType, ReleaseDocument[]>,
      ),
    [visibleReleases],
  )

  const range: LayerRange = useMemo(() => {
    const isDraftsPerspective = typeof selectedPerspectiveName === 'undefined'
    let lastIndex = isDraftsPerspective ? 1 : 0

    const systemStack = [PUBLISHED, isDraftModelEnabled ? LATEST : []].flat()
    const {asap, scheduled} = sortedReleaseTypeReleases

    const offsets = {
      asap: systemStack.length,
      scheduled: systemStack.length + asap.length,
      undecided: systemStack.length + asap.length + scheduled.length,
    }

    const adjustIndexForReleaseType = (type: ReleaseType) => {
      const groupSubsetReleases = sortedReleaseTypeReleases[type]
      const offset = offsets[type]

      groupSubsetReleases.forEach((release, groupReleaseIndex) => {
        const index = offset + groupReleaseIndex

        if (selectedPerspectiveName === getReleaseIdFromReleaseDocumentId(release._id)) {
          lastIndex = index
        }
      })
    }

    orderedReleaseTypes.forEach(adjustIndexForReleaseType)

    return {
      lastIndex,
      offsets,
    }
  }, [isDraftModelEnabled, selectedPerspectiveName, sortedReleaseTypeReleases])

  if (loading) {
    return (
      <Flex padding={4} justifyContent="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  const showStackLine = !isFiltering
  const showPublished =
    !isFiltering || matchesPerspectiveFilter(t('release.navbar.published'), normalizedQuery)
  const showDrafts =
    isDraftModelEnabled &&
    (!isFiltering || matchesPerspectiveFilter(t('release.navbar.drafts'), normalizedQuery))
  const showAgentBundle =
    Boolean(agentBundles[0]) &&
    (!isFiltering ||
      matchesPerspectiveFilter(t('version.agent-bundle.proposed-changes'), normalizedQuery))
  const rangePosition = (index: number) =>
    showStackLine && isRangeVisible ? getRangePosition(range, index) : undefined

  return (
    <Card radius={3}>
      {(showPublished || showDrafts) && (
        <StickyTopCard borderBottom padding={1}>
          <VStack gap={1}>
            {showPublished && (
              <ReleasesMenuItem
                rangePosition={rangePosition(0)}
                release={PUBLISHED}
                menuItemProps={menuItemProps}
              />
            )}
            {showDrafts && (
              <ReleasesMenuItem
                rangePosition={rangePosition(1)}
                release={LATEST}
                menuItemProps={menuItemProps}
              />
            )}
          </VStack>
        </StickyTopCard>
      )}
      {showAgentBundle && agentBundles[0] && (
        <Card borderBottom padding={1}>
          <VStack gap={1}>
            <AgentBundleMenuItem bundle={agentBundles[0]} />
          </VStack>
        </Card>
      )}
      {areReleasesEnabled && (
        <VStack ref={setScrollContainer} data-ui="scroll-wrapper">
          {orderedReleaseTypes.map((releaseType) => (
            <ReleaseTypeMenuSection
              key={releaseType}
              releaseType={releaseType}
              releases={sortedReleaseTypeReleases[releaseType]}
              range={range}
              currentGlobalBundleMenuItemRef={scrollElementRef}
              menuItemProps={menuItemProps}
              showStackLine={showStackLine}
            />
          ))}
        </VStack>
      )}
      {!isFiltering && (
        <StickyBottomCard borderTop paddingY={1} paddingX={2}>
          <VStack gap={1}>
            <ScheduledDraftsMenuItem />
            {areReleasesEnabled && (
              <>
                <ViewContentReleasesMenuItem />
                <CreateReleaseMenuItem onCreateRelease={handleOpenBundleDialog} />
              </>
            )}
          </VStack>
        </StickyBottomCard>
      )}
    </Card>
  )
}
