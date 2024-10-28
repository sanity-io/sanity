import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Menu, MenuDivider, MenuItem, Spinner} from '@sanity/ui'
import {compareDesc} from 'date-fns'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type ReleaseDocument, type ReleaseType} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useReleases} from '../../store/release/useReleases'
import {ReleaseDetailsDialog} from '../components/dialog/ReleaseDetailsDialog'
import {usePerspective} from '../hooks'
import {getPublishDateFromRelease} from '../util/util'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

type ReleaseTypeSort = (a: ReleaseDocument, b: ReleaseDocument) => number

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const StyledPublishedBox = styled(Box)`
  position: sticky;
  top: 0;
  background-color: var(--card-bg-color);
  z-index: 10;
  padding-bottom: 16px;
`

const sortReleaseByPublishAt: ReleaseTypeSort = (ARelease, BRelease) =>
  compareDesc(getPublishDateFromRelease(BRelease), getPublishDateFromRelease(ARelease))
const sortReleaseByTitle: ReleaseTypeSort = (ARelease, BRelease) =>
  ARelease.metadata.title.localeCompare(BRelease.metadata.title)

const releaseTypeSorting: Record<ReleaseType, ReleaseTypeSort> = {
  asap: sortReleaseByTitle,
  scheduled: sortReleaseByPublishAt,
  undecided: sortReleaseByTitle,
}

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const ASAP_RANGE_OFFSET = 2

export function GlobalPerspectiveMenu(): JSX.Element {
  const {loading, data: releases} = useReleases()
  const {currentGlobalBundle} = usePerspective()
  const currentGlobalBundleId = currentGlobalBundle._id
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const styledMenuRef = useRef<HTMLDivElement>(null)

  const {isRangeVisible, onScroll, resetRangeVisibility, setScrollContainer, scrollElementRef} =
    useScrollIndicatorVisibility()

  const {t} = useTranslation()

  /* create new release */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const unarchivedReleases = useMemo(
    () => releases.filter((release) => release.state !== 'archived'),
    [releases],
  )

  const sortedReleaseTypeReleases = useMemo(
    () =>
      orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
        (ReleaseTypeReleases, releaseType) => ({
          ...ReleaseTypeReleases,
          [releaseType]: unarchivedReleases
            .filter(({metadata}) => metadata.releaseType === releaseType)
            .sort(releaseTypeSorting[releaseType]),
        }),
        {} as Record<ReleaseType, ReleaseDocument[]>,
      ),
    [unarchivedReleases],
  )

  const range: LayerRange = useMemo(() => {
    let firstIndex = -1
    let lastIndex = 0

    // if (!releases.published.hidden) {
    firstIndex = 0
    // }

    if (currentGlobalBundleId === 'published') {
      lastIndex = 0
    }

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

      groupSubsetReleases.forEach(({_id}, groupReleaseIndex) => {
        const index = offset + groupReleaseIndex

        if (firstIndex === -1) {
          // if (!item.hidden) {
          firstIndex = index
          // }
        }

        if (_id === currentGlobalBundleId) {
          lastIndex = index
        }
      })
    }

    orderedReleaseTypes.forEach(adjustIndexForReleaseType)

    return {
      firstIndex,
      lastIndex,
      offsets,
    }
  }, [currentGlobalBundleId, sortedReleaseTypeReleases])

  const releasesList = useMemo(() => {
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
          <StyledPublishedBox>
            <GlobalPerspectiveMenuItem
              rangePosition={isRangeVisible ? getRangePosition(range, 0) : undefined}
              release={{_id: 'published', metadata: {title: 'Published'}} as ReleaseDocument}
              toggleable
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
        />
      </Box>
    )
  }, [
    handleCreateBundleClick,
    isRangeVisible,
    loading,
    onScroll,
    range,
    scrollElementRef,
    setScrollContainer,
    sortedReleaseTypeReleases,
    t,
  ])

  return (
    <>
      <MenuButton
        button={
          <Button
            data-testid="global-perspective-menu-button"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
            space={2}
          />
        }
        id="releases-menu"
        onClose={resetRangeVisibility}
        menu={
          <StyledMenu data-testid="release-menu" ref={styledMenuRef}>
            {releasesList}
          </StyledMenu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          placement: 'bottom-end',
          portal: true,
          tone: 'default',
          zOffset: 3000,
        }}
      />
      {createBundleDialogOpen && (
        <ReleaseDetailsDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
