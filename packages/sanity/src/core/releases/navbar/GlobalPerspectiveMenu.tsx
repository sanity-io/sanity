import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Label, Menu, MenuDivider, MenuItem, Spinner} from '@sanity/ui'
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
import {GlobalPerspectiveMenuLabelIndicator} from './PerspectiveLayerIndicator'

const StyledMenu = styled(Menu)`
  min-width: 200;
  max-width: 320px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  asap: 'release.type.asap',
  scheduled: 'release.type.scheduled',
  undecided: 'release.type.undecided',
}

function ReleaseTypeSection({
  releaseType,
  releases,
  range,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  range: LayerRange
}): JSX.Element | null {
  const {t} = useTranslation()

  if (releases.length === 0) return null

  const {firstIndex, lastIndex, offsets} = range
  const releaseTypeOffset = offsets[releaseType]

  return (
    <>
      <GlobalPerspectiveMenuLabelIndicator
        $withinRange={firstIndex < releaseTypeOffset && lastIndex >= releaseTypeOffset}
        paddingRight={2}
        paddingTop={4}
        paddingBottom={2}
      >
        <Label muted style={{textTransform: 'uppercase'}} size={1}>
          {t(RELEASE_TYPE_LABELS[releaseType])}
        </Label>
      </GlobalPerspectiveMenuLabelIndicator>
      {releases.map((release, index) => (
        <GlobalPerspectiveMenuItem
          release={release}
          key={release._id}
          rangePosition={getRangePosition(range, releaseTypeOffset + index)}
          toggleable={releaseTypeOffset < lastIndex}
        />
      ))}
    </>
  )
}

type ReleaseTypeSort = (a: ReleaseDocument, b: ReleaseDocument) => number

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
        <GlobalPerspectiveMenuItem
          rangePosition={getRangePosition(range, 0)}
          release={{_id: 'published', metadata: {title: 'Published'}} as ReleaseDocument}
          toggleable
        />
        <StyledBox>
          {orderedReleaseTypes.map((releaseType) => (
            <ReleaseTypeSection
              key={releaseType}
              releaseType={releaseType}
              releases={sortedReleaseTypeReleases[releaseType]}
              range={range}
            />
          ))}
        </StyledBox>
        <MenuDivider />
        <MenuItem
          icon={AddIcon}
          onClick={handleCreateBundleClick}
          text={t('release.action.create-new')}
        />
      </Box>
    )
  }, [handleCreateBundleClick, loading, range, sortedReleaseTypeReleases, t])

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
