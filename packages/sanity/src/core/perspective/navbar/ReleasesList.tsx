import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import {type JSX, type RefObject, useMemo} from 'react'
import {styled} from 'styled-components'

import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
import {type ScrollElement} from './useScrollIndicatorVisibility'
import {ViewContentReleasesMenuItem} from './ViewContentReleasesMenuItem'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const ScrollWrapper = styled(Stack)`
  overflow: auto;
  max-height: 75vh;
`

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  onScroll,
  isRangeVisible,
  selectedPerspectiveName,
  handleOpenBundleDialog,
  scrollElementRef,
  menuItemProps,
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLDivElement) => void
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  isRangeVisible: boolean
  selectedPerspectiveName: string | undefined
  handleOpenBundleDialog: () => void
  scrollElementRef: RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): JSX.Element {
  const {loading, data: allReleases} = useActiveReleases()

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
      <Flex padding={4} justify="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Card radius={3} overflow="hidden">
      <Card borderBottom padding={1}>
        <Stack space={1}>
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
        </Stack>
      </Card>
      {areReleasesEnabled && (
        <ScrollWrapper ref={setScrollContainer} onScroll={onScroll} data-ui="scroll-wrapper">
          {orderedReleaseTypes.map((releaseType) => (
            <ReleaseTypeMenuSection
              key={releaseType}
              releaseType={releaseType}
              releases={sortedReleaseTypeReleases[releaseType]}
              range={range}
              currentGlobalBundleMenuItemRef={scrollElementRef}
              menuItemProps={menuItemProps}
            />
          ))}
        </ScrollWrapper>
      )}
      {areReleasesEnabled && (
        <Card borderTop paddingY={1} paddingX={2}>
          <Stack space={1}>
            <ScheduledDraftsMenuItem />
            <ViewContentReleasesMenuItem />
            <CreateReleaseMenuItem onCreateRelease={handleOpenBundleDialog} />
          </Stack>
        </Card>
      )}
    </Card>
  )
}
