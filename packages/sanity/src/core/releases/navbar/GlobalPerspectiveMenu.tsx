import {AddIcon, CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Button, Flex, Menu, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton, Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useBundles} from '../../store/bundles/useBundles'
import {ReleaseDetailsDialog} from '../components/dialog/ReleaseDetailsDialog'
import {usePerspective} from '../hooks'
import {LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/util'

const StyledMenu = styled(Menu)`
  min-width: 200px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 200px;
`

export function GlobalPerspectiveMenu(): JSX.Element {
  const {deletedBundles, loading, data: bundles} = useBundles()
  const {currentGlobalBundle, setPerspective} = usePerspective()
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const styledMenuRef = useRef<HTMLDivElement>(null)

  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    if (!bundles) return []

    return [...(bundles || []), ...Object.values(deletedBundles)].filter(
      ({_id, archivedAt}) => !isDraftOrPublished(_id) && !archivedAt,
    )
  }, [bundles, deletedBundles])
  const hasBundles = sortedBundlesToDisplay.length > 0

  const handleBundleChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  const isBundleDeleted = useCallback(
    (bundleId: string) => Boolean(deletedBundles[bundleId]),
    [deletedBundles],
  )

  /* create new bundle */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

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
        <MenuItem
          iconRight={
            currentGlobalBundle._id === LATEST._id ? (
              <CheckmarkIcon data-testid="latest-checkmark-icon" />
            ) : undefined
          }
          onClick={handleBundleChange(LATEST._id)}
          pressed={false}
          text={LATEST.title}
          data-testid="latest-menu-item"
        />
        {hasBundles && (
          <>
            <MenuDivider />
            <StyledBox data-testid="bundles-list">
              {sortedBundlesToDisplay.map(({_id, ...bundle}) => (
                <MenuItem
                  key={_id}
                  onClick={handleBundleChange(_id)}
                  padding={1}
                  pressed={false}
                  disabled={isBundleDeleted(_id)}
                  data-testid={`bundle-${_id}`}
                >
                  <Tooltip
                    disabled={!isBundleDeleted(_id)}
                    content={t('release.deleted-tooltip')}
                    placement="bottom-start"
                  >
                    <Flex>
                      <Box flex={1} padding={2} style={{minWidth: 100}}>
                        <Text size={1} weight="medium">
                          {bundle.title}
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
            text={t('release.action.create')}
          />
        </>
      </>
    )
  }, [
    currentGlobalBundle._id,
    handleBundleChange,
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
          <Button iconRight={ChevronDownIcon} mode="bleed" padding={2} radius="full" space={2} />
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
