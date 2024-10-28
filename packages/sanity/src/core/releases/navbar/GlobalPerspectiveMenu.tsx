import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Label, Menu, MenuDivider, MenuItem, Spinner} from '@sanity/ui'
import {compareDesc} from 'date-fns'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type ReleaseDocument} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useReleases} from '../../store/release/useReleases'
import {ReleaseDetailsDialog} from '../components/dialog/ReleaseDetailsDialog'
import {usePerspective} from '../hooks'
import {getPublishDateFromRelease} from '../util/util'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'

const StyledMenu = styled(Menu)`
  max-width: 320px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const LabelBox = styled(Box)`
  position: relative;

  &[data-within-range]:before {
    content: '';
    display: block;
    position: absolute;
    left: 18px;
    top: 0;
    bottom: -4px;
    width: 5px;
    background-color: var(--card-border-color);
  }
`

interface LayerRange {
  firstIndex: number
  lastIndex: number
  offsets: {
    asap: number
    scheduled: number
    undecided: number
  }
}

function getRangePosition(
  range: LayerRange,
  index: number,
): 'first' | 'within' | 'last' | undefined {
  if (range.firstIndex === range.lastIndex) {
    return undefined
  }

  if (index === range.firstIndex) {
    return 'first'
  }

  if (index === range.lastIndex) {
    return 'last'
  }

  if (index > range.firstIndex && index < range.lastIndex) {
    return 'within'
  }

  return undefined
}

const sortReleaseByPublishAt: (a: ReleaseDocument, b: ReleaseDocument) => number = (
  ARelease,
  BRelease,
) => compareDesc(getPublishDateFromRelease(BRelease), getPublishDateFromRelease(ARelease))

const sortReleaseByTitle: (a: ReleaseDocument, b: ReleaseDocument) => number = (
  ARelease,
  BRelease,
) => ARelease.metadata.title.localeCompare(BRelease.metadata.title)

const releaseTypeSorting = {
  asap: sortReleaseByTitle,
  scheduled: sortReleaseByPublishAt,
  undecided: sortReleaseByTitle,
}

const releaseTypeGroups: ('asap' | 'scheduled' | 'undecided')[] = ['asap', 'scheduled', 'undecided']

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

  const releaseTypeReleases = useMemo(
    () =>
      releaseTypeGroups.reduce<Record<string, ReleaseDocument[]>>(
        (acc, type) => ({
          ...acc,
          [type]: unarchivedReleases
            .filter(({metadata}) => metadata.releaseType === type)
            .sort(releaseTypeSorting[type]),
        }),
        {},
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

    const {asap, scheduled} = releaseTypeReleases

    const processReleases = (groupSubsetReleases: ReleaseDocument[], offset: number) => {
      groupSubsetReleases.forEach(({_id}, i) => {
        const index = offset + i

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

    const offsets = {
      asap: 2,
      scheduled: 2 + asap.length,
      undecided: 2 + asap.length + scheduled.length,
    }

    releaseTypeGroups.forEach((type) => processReleases(releaseTypeReleases[type], offsets[type]))

    return {
      firstIndex,
      lastIndex,
      offsets,
    }
  }, [currentGlobalBundleId, releaseTypeReleases])

  const releasesList = useMemo(() => {
    if (loading) {
      return (
        <Flex padding={4} justify="center" data-testid="spinner">
          <Spinner muted />
        </Flex>
      )
    }

    return (
      <>
        <GlobalPerspectiveMenuItem
          rangePosition={getRangePosition(range, 0)}
          release={{_id: 'published', metadata: {title: 'Published'}} as ReleaseDocument}
          toggleable
        />
        <StyledBox>
          {releaseTypeReleases.asap.length > 0 && (
            <>
              <LabelBox
                data-within-range={
                  range.firstIndex < range.offsets.asap && range.lastIndex >= range.offsets.asap
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={2}
                style={{paddingLeft: 40}}
              >
                <Label muted style={{textTransform: 'uppercase'}} size={1}>
                  {t('release.type.asap')}
                </Label>
              </LabelBox>
              {releaseTypeReleases.asap.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.offsets.asap + index)}
                  toggleable={range.offsets.asap < range.lastIndex}
                />
              ))}
            </>
          )}
          {releaseTypeReleases.scheduled.length > 0 && (
            <>
              <LabelBox
                data-within-range={
                  range.firstIndex < range.offsets.scheduled &&
                  range.lastIndex >= range.offsets.scheduled
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={2}
                style={{paddingLeft: 40}}
              >
                <Label muted style={{textTransform: 'uppercase'}} size={1}>
                  {t('release.type.scheduled')}
                </Label>
              </LabelBox>
              {releaseTypeReleases.scheduled.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.offsets.scheduled + index)}
                  toggleable={range.offsets.scheduled < range.lastIndex}
                />
              ))}
            </>
          )}

          {releaseTypeReleases.undecided.length > 0 && (
            <>
              <LabelBox
                data-within-range={
                  range.firstIndex < range.offsets.undecided &&
                  range.lastIndex >= range.offsets.undecided
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={2}
                style={{paddingLeft: 40}}
              >
                <Label muted style={{textTransform: 'uppercase'}} size={1}>
                  {t('release.type.undecided')}
                </Label>
              </LabelBox>
              {releaseTypeReleases.undecided.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.offsets.undecided + index)}
                  toggleable={range.offsets.undecided < range.lastIndex}
                />
              ))}
            </>
          )}
        </StyledBox>

        <MenuDivider />
        <MenuItem
          icon={AddIcon}
          onClick={handleCreateBundleClick}
          text={t('release.action.create-new')}
        />
      </>
    )
  }, [
    handleCreateBundleClick,
    loading,
    range,
    releaseTypeReleases.asap,
    releaseTypeReleases.scheduled,
    releaseTypeReleases.undecided,
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
