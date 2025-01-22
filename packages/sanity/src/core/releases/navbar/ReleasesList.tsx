import {AddIcon} from '@sanity/icons'
import {Box, Flex, MenuDivider, Spinner} from '@sanity/ui'
import {type RefObject, useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type ReleaseDocument, type ReleaseType} from '../store/types'
import {useActiveReleases} from '../store/useActiveReleases'
import {LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
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

const StyledPublishedBox = styled(Box)<{$removePadding: boolean}>(
  ({$removePadding}) => css`
    position: sticky;
    top: 0;
    background-color: var(--card-bg-color);
    z-index: 10;
    padding-bottom: ${$removePadding ? '4px' : '16px'};
  `,
)

export function ReleasesList({
  setScrollContainer,
  onScroll,
  isRangeVisible,
  selectedReleaseId,
  setCreateBundleDialogOpen,
  scrollElementRef,
}: {
  setScrollContainer: (el: HTMLDivElement) => void
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  isRangeVisible: boolean
  selectedReleaseId: string | undefined
  setCreateBundleDialogOpen: (open: boolean) => void
  scrollElementRef: RefObject<ScrollElement>
}): React.JSX.Element {
  const {loading, data: releases} = useActiveReleases()
  const {t} = useTranslation()
  /* create new release */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [setCreateBundleDialogOpen])

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
    let lastIndex = 0

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
  }, [selectedReleaseId, sortedReleaseTypeReleases])

  if (loading) {
    return (
      <Flex padding={4} justify="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Box>
      <StyledBox ref={setScrollContainer} onScroll={onScroll}>
        <StyledPublishedBox $removePadding={!releases.length}>
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 0) : undefined}
            release={'published'}
          />
          <GlobalPerspectiveMenuItem
            rangePosition={isRangeVisible ? getRangePosition(range, 1) : undefined}
            release={LATEST}
          />
        </StyledPublishedBox>
        <>
          {orderedReleaseTypes.map((releaseType) => (
            <ReleaseTypeMenuSection
              key={releaseType}
              releaseType={releaseType}
              releases={sortedReleaseTypeReleases[releaseType]}
              range={range}
              currentGlobalBundleMenuItemRef={scrollElementRef}
            />
          ))}
        </>
      </StyledBox>
      <MenuDivider />
      <MenuItem
        icon={AddIcon}
        onClick={handleCreateBundleClick}
        text={t('release.action.create-new')}
        data-testid="release.action.create-new"
      />
    </Box>
  )
}
