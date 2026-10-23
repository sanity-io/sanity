import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Spinner} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'
import {Fragment, type JSX, type RefObject, useMemo} from 'react'
import {styled} from 'styled-components'
import {Flex, VStack} from 'ui5'

import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {ScheduledDraftsMenuItem, useScheduledDraftsAvailable} from './ScheduledDraftsMenuItem'
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

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  isRangeVisible,
  selectedPerspectiveName,
  handleOpenBundleDialog,
  scrollElementRef,
  menuItemProps,
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLElement | null) => void
  isRangeVisible: boolean
  selectedPerspectiveName: string | undefined
  handleOpenBundleDialog: () => void
  scrollElementRef: RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): JSX.Element {
  const {loading, data: allReleases} = useActiveReleases()
  const {
    bundles: [agentBundle],
  } = useAgentBundles()
  const isScheduledDraftsAvailable = useScheduledDraftsAvailable()

  const releases = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const sortedReleaseTypeReleases = useMemo(
    () =>
      orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
        (ReleaseTypeReleases, releaseType) => ({
          ...ReleaseTypeReleases,
          [releaseType]: releases.filter(({metadata}) => metadata.releaseType === releaseType),
        }),
        {} as Record<ReleaseType, ReleaseDocument[]>,
      ),
    [releases],
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

  // The system perspectives stuck to the top, then two optional parts, each left out when empty:
  // the scrolling sections (an agent bundle, then a section per release type with releases) and
  // the actions stuck to the bottom. The sticky cards draw their separator as a border so it
  // holds while the sections scroll underneath; dividers go between scrolling sections only.
  const releaseTypesWithReleases = areReleasesEnabled
    ? orderedReleaseTypes.filter((releaseType) => sortedReleaseTypeReleases[releaseType].length > 0)
    : []
  const hasAgentBundle = agentBundle !== undefined
  const hasScrollingSections = hasAgentBundle || releaseTypesWithReleases.length > 0
  const hasActions = isScheduledDraftsAvailable || areReleasesEnabled

  return (
    <Card radius={3}>
      <StickyTopCard borderBottom={hasScrollingSections} padding={1}>
        <VStack gap={1}>
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 0) : undefined}
            release={'published'}
            menuItemProps={menuItemProps}
          />
          {isDraftModelEnabled && (
            <GlobalPerspectiveMenuItem
              rangePosition={isRangeVisible ? getRangePosition(range, 1) : undefined}
              release={LATEST}
              menuItemProps={menuItemProps}
            />
          )}
        </VStack>
      </StickyTopCard>
      {hasScrollingSections && (
        <VStack ref={setScrollContainer} data-ui="scroll-wrapper">
          {agentBundle && (
            <Card padding={1}>
              <AgentBundleMenuItem bundle={agentBundle} />
            </Card>
          )}
          {releaseTypesWithReleases.map((releaseType, index) => (
            <Fragment key={releaseType}>
              {(hasAgentBundle || index > 0) && <MenuDivider />}
              <ReleaseTypeMenuSection
                releaseType={releaseType}
                releases={sortedReleaseTypeReleases[releaseType]}
                range={range}
                currentGlobalBundleMenuItemRef={scrollElementRef}
                menuItemProps={menuItemProps}
              />
            </Fragment>
          ))}
        </VStack>
      )}
      {hasActions && (
        <StickyBottomCard borderTop paddingY={1} paddingX={2}>
          <VStack gap={1}>
            {isScheduledDraftsAvailable && <ScheduledDraftsMenuItem />}
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
