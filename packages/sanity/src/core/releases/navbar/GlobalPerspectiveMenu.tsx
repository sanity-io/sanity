import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Label, Menu, MenuDivider, MenuItem, Spinner} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type ReleaseDocument} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useReleases} from '../../store/release/useReleases'
import {ReleaseDetailsDialog} from '../components/dialog/ReleaseDetailsDialog'
import {usePerspective} from '../hooks'
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
  immediatelyOffset: number
  futureOffset: number
  neverOffset: number
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

export function GlobalPerspectiveMenu(): JSX.Element {
  const {loading, data: releases} = useReleases()
  const {currentGlobalBundle, setPerspectiveFromRelease, setPerspective} = usePerspective()
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

  const unarchivedReleases = releases.filter((release) => release.state !== 'archived')

  const releaseTypeReleases = {
    asap: unarchivedReleases.filter(({metadata}) => metadata.releaseType === 'asap'),
    scheduled: unarchivedReleases.filter(({metadata}) => metadata.releaseType === 'scheduled'),
    undecided: unarchivedReleases.filter(({metadata}) => metadata.releaseType === 'undecided'),
  }

  const range: LayerRange = useMemo(() => {
    let firstIndex = -1
    let lastIndex = 0

    // if (!releases.published.hidden) {
    firstIndex = 0
    // }

    if (currentGlobalBundle._id === 'published') {
      lastIndex = 0
    }

    const immediatelyOffset = 2
    const futureOffset = immediatelyOffset + releaseTypeReleases.asap.length
    const neverOffset = futureOffset + releaseTypeReleases.scheduled.length

    for (const item of releaseTypeReleases.asap) {
      const index = immediatelyOffset + releaseTypeReleases.asap.indexOf(item)

      if (firstIndex === -1) {
        // if (!item.hidden) {
        firstIndex = index
        // }
      }

      if (item._id === currentGlobalBundle._id) {
        lastIndex = index
      }
    }

    for (const item of releaseTypeReleases.scheduled) {
      const index = futureOffset + releaseTypeReleases.scheduled.indexOf(item)

      if (firstIndex === -1) {
        // if (!item.hidden) {
        firstIndex = index
        // }
      }

      if (item._id === currentGlobalBundle._id) {
        lastIndex = index
      }
    }

    for (const item of releaseTypeReleases.undecided) {
      const index = neverOffset + releaseTypeReleases.undecided.indexOf(item)

      if (firstIndex === -1) {
        // if (!item.hidden) {
        firstIndex = index
        // }
      }

      if (item._id === currentGlobalBundle._id) {
        lastIndex = index
      }
    }

    return {firstIndex, lastIndex, immediatelyOffset, futureOffset, neverOffset}
  }, [
    currentGlobalBundle._id,
    releaseTypeReleases.asap,
    releaseTypeReleases.scheduled,
    releaseTypeReleases.undecided,
  ])

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
                  range.firstIndex < range.immediatelyOffset &&
                  range.lastIndex >= range.immediatelyOffset
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={1}
                style={{paddingLeft: 33}}
              >
                <Label muted size={1}>
                  ASAP
                </Label>
              </LabelBox>
              {releaseTypeReleases.asap.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.immediatelyOffset + index)}
                  toggleable={range.immediatelyOffset < range.lastIndex}
                />
              ))}
            </>
          )}
          {releaseTypeReleases.scheduled.length > 0 && (
            <>
              <LabelBox
                data-within-range={
                  range.firstIndex < range.futureOffset && range.lastIndex >= range.futureOffset
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={1}
                style={{paddingLeft: 33}}
              >
                <Label muted size={1}>
                  Scheduled
                </Label>
              </LabelBox>
              {releaseTypeReleases.scheduled.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.futureOffset + index)}
                  toggleable={range.futureOffset < range.lastIndex}
                />
              ))}
            </>
          )}

          {releaseTypeReleases.undecided.length > 0 && (
            <>
              <LabelBox
                data-within-range={
                  range.firstIndex < range.neverOffset && range.lastIndex >= range.neverOffset
                    ? ''
                    : undefined
                }
                paddingX={2}
                paddingTop={4}
                paddingBottom={1}
                style={{paddingLeft: 33}}
              >
                <Label muted size={1}>
                  Undecided
                </Label>
              </LabelBox>
              {releaseTypeReleases.undecided.map((item, index) => (
                <GlobalPerspectiveMenuItem
                  release={item}
                  key={item.name}
                  rangePosition={getRangePosition(range, range.neverOffset + index)}
                  toggleable={range.neverOffset < range.lastIndex}
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
    loading,
    range,
    releaseTypeReleases.asap,
    releaseTypeReleases.scheduled,
    releaseTypeReleases.undecided,
    handleCreateBundleClick,
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
