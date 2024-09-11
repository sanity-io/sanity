import {CheckmarkIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Flex, Menu, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {memo, type ReactElement, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {MenuButton, Tooltip} from '../../../ui-components'
import {LATEST} from '../../bundles/util/const'
import {isDraftOrPublished} from '../../bundles/util/util'
import {useTranslation} from '../../i18n'
import {type BundleDocument} from '../../store/bundles/types'
import {useBundles} from '../../store/bundles/useBundles'
import {usePerspective} from '../hooks'
import {ReleaseBadge} from './ReleaseBadge'

const StyledMenu = styled(Menu)`
  min-width: 200px;
`

const StyledBox = styled(Box)`
  overflow: auto;
  max-height: 200px;
`

interface BundleListProps {
  button: ReactElement
  bundles: BundleDocument[] | null
  loading: boolean
  actions?: ReactElement
  perspective?: string
}

/**
 * @internal
 */
export const ReleasesMenu = memo(function ReleasesMenu(props: BundleListProps): ReactElement {
  const {bundles, loading, actions, button, perspective} = props
  const {deletedBundles} = useBundles()
  const {currentGlobalBundle, setPerspective} = usePerspective(perspective)
  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    if (!bundles) return []

    return bundles
      .filter(({_id, archivedAt}) => !isDraftOrPublished(_id) && !archivedAt)
      .sort(({_id: aId}, {_id: bId}) => Number(deletedBundles[aId]) - Number(deletedBundles[bId]))
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

  return (
    <>
      <MenuButton
        button={button}
        id="release-menu"
        menu={
          <StyledMenu data-testid="release-menu">
            {loading ? (
              <Flex padding={4} justify="center" data-testid="spinner">
                <Spinner muted />
              </Flex>
            ) : (
              <>
                <MenuItem
                  iconRight={
                    currentGlobalBundle._id === LATEST._id ? (
                      <CheckmarkIcon data-testid="latest-checkmark-icon" />
                    ) : undefined
                  }
                  onClick={handleBundleChange('drafts')}
                  pressed={false}
                  text={LATEST.title}
                  data-testid="latest-menu-item"
                />
                {hasBundles && (
                  <>
                    <MenuDivider />
                    <StyledBox data-testid="bundles-list">
                      {sortedBundlesToDisplay.map((bundle) => (
                        <MenuItem
                          key={bundle._id}
                          onClick={handleBundleChange(bundle._id)}
                          padding={1}
                          pressed={false}
                          disabled={isBundleDeleted(bundle._id)}
                          data-testid={`bundle-${bundle._id}`}
                        >
                          <Tooltip
                            disabled={!isBundleDeleted(bundle._id)}
                            content={t('release.deleted-tooltip')}
                            placement="bottom-start"
                          >
                            <Flex>
                              <ReleaseBadge
                                hue={bundle.hue}
                                icon={bundle.icon}
                                padding={2}
                                isDisabled={isBundleDeleted(bundle._id)}
                              />

                              <Box flex={1} padding={2} style={{minWidth: 100}}>
                                <Text size={1} weight="medium">
                                  {bundle.title}
                                </Text>
                              </Box>

                              {/*<Box padding={2}>
                                <Text muted size={1}>
                                  {bundle.publishAt ? (
                                    <RelativeTime time={bundle.publishAt as Date} useTemporalPhrase />
                                  ) : (
                                    'No target date'
                                  )}
                                </Text>
                              </Box>*/}

                              <Box padding={2}>
                                <Text size={1}>
                                  <CheckmarkIcon
                                    style={{
                                      opacity: currentGlobalBundle._id === bundle._id ? 1 : 0,
                                    }}
                                    data-testid={`${bundle._id}-checkmark-icon`}
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

                {actions && (
                  <>
                    <MenuDivider />
                    {actions}
                  </>
                )}
              </>
            )}
          </StyledMenu>
        }
        popover={{
          placement: 'bottom-start',
          portal: true,
          zOffset: 3000,
        }}
      />
    </>
  )
})
