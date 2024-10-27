import {AddIcon, CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Menu, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton, Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useReleases} from '../../store/release/useReleases'
import {ReleaseDetailsDialog} from '../components/dialog/ReleaseDetailsDialog'
import {usePerspective} from '../hooks'
import {isDraftOrPublished} from '../util/util'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 200px;
`

interface LayerRange {
  firstIndex: number
  lastIndex: number
  immediatelyOffset: number
  futureOffset: number
  neverOffset: number
}

export function GlobalPerspectiveMenu(): JSX.Element {
  const {deletedReleases, loading, data: releases} = useReleases()
  const {currentGlobalBundle, setPerspectiveFromRelease, setPerspective} = usePerspective()
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const styledMenuRef = useRef<HTMLDivElement>(null)

  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    if (!releases) return []

    return [...(releases || []), ...Object.values(deletedReleases)].filter(
      ({_id, state}) => !isDraftOrPublished(_id) && state !== 'archived',
    )
  }, [releases, deletedReleases])
  const hasBundles = sortedBundlesToDisplay.length > 0

  const handleBundleChange = useCallback(
    (releaseId: string) => () => {
      setPerspectiveFromRelease(releaseId)
    },
    [setPerspectiveFromRelease],
  )

  const isBundleDeleted = useCallback(
    (releaseId: string) => Boolean(deletedReleases[releaseId]),
    [deletedReleases],
  )

  /* create new release */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const range: LayerRange = useMemo(() => {
    let firstIndex = -1
    let lastIndex = 0

    if (!release.published.hidden) {
      firstIndex = 0
    }

    if (current.id === 'published') {
      lastIndex = 0
    }

    const immediatelyOffset = 2
    const futureOffset = immediatelyOffset + items.immediately.length
    const neverOffset = futureOffset + items.future.length

    for (const item of items.immediately) {
      const index = immediatelyOffset + items.immediately.indexOf(item)

      if (firstIndex === -1) {
        if (!item.hidden) {
          firstIndex = index
        }
      }

      if (item.name === current.id) {
        lastIndex = index
      }
    }

    for (const item of items.future) {
      const index = futureOffset + items.future.indexOf(item)

      if (firstIndex === -1) {
        if (!item.hidden) {
          firstIndex = index
        }
      }

      if (item.name === current.id) {
        lastIndex = index
      }
    }

    for (const item of items.never) {
      const index = neverOffset + items.never.indexOf(item)

      if (firstIndex === -1) {
        if (!item.hidden) {
          firstIndex = index
        }
      }

      if (item.name === current.id) {
        lastIndex = index
      }
    }

    return {firstIndex, lastIndex, immediatelyOffset, futureOffset, neverOffset}
  }, [current, items])

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
          item={{_id: 'published'}}
          toggleable
        />
        {hasBundles && (
          <>
            <MenuDivider />
            <StyledBox data-testid="releases-list">
              {sortedBundlesToDisplay.map(({_id, ...release}) => (
                <MenuItem
                  key={_id}
                  onClick={handleBundleChange(_id)}
                  padding={1}
                  pressed={false}
                  disabled={isBundleDeleted(_id)}
                  data-testid={`release-${_id}`}
                >
                  <Tooltip
                    disabled={!isBundleDeleted(_id)}
                    content={t('release.deleted-tooltip')}
                    placement="bottom-start"
                  >
                    <Flex>
                      <Box flex={1} padding={2} style={{minWidth: 100}}>
                        <Text size={1} weight="medium">
                          {release.metadata.title}
                        </Text>
                      </Box>
                      <Box padding={2}>
                        <Text size={1}>
                          <CheckmarkIcon
                            style={{
                              opacity: currentGlobalBundle._id === _id ? 1 : 0,
                            }}
                            data-testid={`${_id}-checkmark-icon`}
                          />
                        </Text>
                      </Box>
                    </Flex>
                  </Tooltip>
                </MenuItem>
              ))}
            </StyledBox>
          </>
        )}

        <>
          <MenuDivider />
          <MenuItem
            icon={AddIcon}
            onClick={handleCreateBundleClick}
            text={t('release.action.create-new')}
          />
        </>
      </>
    )
  }, [
    currentGlobalBundle._id,
    handleBundleChange,
    setPerspective,
    handleCreateBundleClick,
    hasBundles,
    isBundleDeleted,
    loading,
    sortedBundlesToDisplay,
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
