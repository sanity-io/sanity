import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Menu, MenuDivider, MenuItem, Spinner} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {CreateReleaseDialog} from '../components/dialog/CreateReleaseDialog'
import {usePerspective} from '../hooks/usePerspective'
import {type ReleaseDocument, type ReleaseType} from '../store/types'
import {useReleases} from '../store/useReleases'
import {LATEST} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
`

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

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

const ASAP_RANGE_OFFSET = 2

export function GlobalPerspectiveMenu(): React.JSX.Element {
  const {loading, data: releases} = useReleases()
  const {selectedReleaseId} = usePerspective()
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
        />
      </Box>
    )
  }, [
    handleCreateBundleClick,
    isRangeVisible,
    loading,
    onScroll,
    range,
    releases.length,
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
        <CreateReleaseDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
