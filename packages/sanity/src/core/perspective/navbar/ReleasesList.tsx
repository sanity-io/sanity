import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Box, Flex, MenuDivider, Spinner} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type RefObject, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
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
    background-color: ${vars.color.bg};
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
  const {loading, data: allReleases} = useActiveReleases()
  const {selectedPerspectiveName} = usePerspective()

  const releases = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const handleCreateBundleClick = useCallback(
    () => setCreateBundleDialogOpen(true),
    [setCreateBundleDialogOpen],
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
  }, [isDraftModelEnabled, selectedPerspectiveName, selectedReleaseId, sortedReleaseTypeReleases])

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
          {isDraftModelEnabled && (
            <GlobalPerspectiveMenuItem
              rangePosition={isRangeVisible ? getRangePosition(range, 1) : undefined}
              release={LATEST}
              menuItemProps={menuItemProps}
            />
          )}
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
