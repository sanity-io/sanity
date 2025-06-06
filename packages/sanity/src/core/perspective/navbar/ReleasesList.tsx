import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Box, Flex, MenuDivider, Spinner} from '@sanity/ui'
import {type RefObject, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useReleasesUpsell} from '../../releases/contexts/upsell/useReleasesUpsell'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {usePerspective} from '../usePerspective'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {type ScrollElement} from './useScrollIndicatorVisibility'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const ASAP_RANGE_OFFSET = 2

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const StyledPublishedBox = styled(Box)<{$reducePadding: boolean; $removePadding?: boolean}>(({
  $reducePadding,
  $removePadding,
}) => {
  const padding = $reducePadding ? '4px' : '16px'
  return css`
    position: sticky;
    top: 0;
    background-color: var(--card-bg-color);
    z-index: 10;
    padding-bottom: ${$removePadding ? '0px' : padding};
  `
})

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  onScroll,
  isRangeVisible,
  selectedReleaseId,
  setCreateBundleDialogOpen,
  scrollElementRef,
  menuItemProps,
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLDivElement) => void
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  isRangeVisible: boolean
  selectedReleaseId: string | undefined
  setCreateBundleDialogOpen: (open: boolean) => void
  scrollElementRef: RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element {
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  const {loading, data: releases} = useActiveReleases()
  const {selectedPerspectiveName} = usePerspective()

  const handleCreateBundleClick = useCallback(
    () => guardWithReleaseLimitUpsell(() => setCreateBundleDialogOpen(true)),
    [guardWithReleaseLimitUpsell, setCreateBundleDialogOpen],
  )

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

    const {asap, scheduled} = sortedReleaseTypeReleases
    const countAsapReleases = asap.length
    const countScheduledReleases = scheduled.length

    const offsets = {
      asap: ASAP_RANGE_OFFSET,
      scheduled: ASAP_RANGE_OFFSET + countAsapReleases,
      undecided: ASAP_RANGE_OFFSET + countAsapReleases + countScheduledReleases,
    }

    const adjustIndexForReleaseType = (type: ReleaseType) => {
      const groupSubsetReleases = sortedReleaseTypeReleases[type]
      const offset = offsets[type]

      groupSubsetReleases.forEach((release, groupReleaseIndex) => {
        const index = offset + groupReleaseIndex

        if (selectedReleaseId === getReleaseIdFromReleaseDocumentId(release._id)) {
          lastIndex = index
        }
      })
    }

    orderedReleaseTypes.forEach(adjustIndexForReleaseType)

    return {
      lastIndex,
      offsets,
    }
  }, [selectedPerspectiveName, selectedReleaseId, sortedReleaseTypeReleases])

  if (loading) {
    return (
      <Flex padding={4} justify="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <>
      <StyledBox ref={setScrollContainer} onScroll={onScroll}>
        <StyledPublishedBox
          $reducePadding={!releases.length || !areReleasesEnabled}
          $removePadding={!areReleasesEnabled}
        >
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 0) : undefined}
            release={'published'}
            menuItemProps={menuItemProps}
          />
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 1) : undefined}
            release={LATEST}
            menuItemProps={menuItemProps}
          />
        </StyledPublishedBox>
        {areReleasesEnabled && (
          <>
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
          </>
        )}
      </StyledBox>
      {areReleasesEnabled && (
        <>
          <MenuDivider />
          <CreateReleaseMenuItem onCreateRelease={handleCreateBundleClick} />
        </>
      )}
    </>
  )
}
