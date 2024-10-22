import {CheckmarkIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Flex, Menu, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {memo, type ReactElement, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {MenuButton, Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {type ReleaseDocument} from '../../store/release/types'
import {useReleases} from '../../store/release/useReleases'
import {usePerspective} from '../hooks'
import {LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/util'
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
  bundles: ReleaseDocument[] | null
  loading: boolean
  actions?: ReactElement
  perspective?: string
}

/**
 * @internal
 */
export const ReleasesMenu = memo(function ReleasesMenu(props: BundleListProps): ReactElement {
  const {bundles, loading, actions, button, perspective} = props
  const {deletedReleases} = useReleases()
  const {currentGlobalBundle, setPerspective} = usePerspective(perspective)
  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    if (!bundles) return []

    return bundles
      .filter(({_id, state}) => !isDraftOrPublished(_id) && state !== 'archived')
      .sort(({_id: aId}, {_id: bId}) => Number(deletedReleases[aId]) - Number(deletedReleases[bId]))
  }, [bundles, deletedReleases])
  const hasBundles = sortedBundlesToDisplay.length > 0

  const handleReleaseChange = useCallback(
    (bundleId: string) => () => {
      setPerspective(bundleId)
    },
    [setPerspective],
  )

  const isBundleDeleted = useCallback(
    (bundleId: string) => Boolean(deletedReleases[bundleId]),
    [deletedReleases],
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
                  onClick={handleReleaseChange('drafts')}
                  pressed={false}
                  text={LATEST.title}
                  data-testid="latest-menu-item"
                />
                {hasBundles && (
                  <>
                    <MenuDivider />
                    <StyledBox data-testid="bundles-list">
                      {sortedBundlesToDisplay.map((release) => (
                        <MenuItem
                          key={release._id}
                          onClick={handleReleaseChange(release._id)}
                          padding={1}
                          pressed={false}
                          disabled={isBundleDeleted(release._id)}
                          data-testid={`bundle-${release._id}`}
                        >
                          <Tooltip
                            disabled={!isBundleDeleted(release._id)}
                            content={t('release.deleted-tooltip')}
                            placement="bottom-start"
                          >
                            <Flex>
                              <ReleaseBadge
                                hue={release.metadata.hue}
                                icon={release.metadata.icon}
                                padding={2}
                                isDisabled={isBundleDeleted(release._id)}
                              />

                              <Box flex={1} padding={2} style={{minWidth: 100}}>
                                <Text size={1} weight="medium">
                                  {release.metadata.title}
                                </Text>
                              </Box>

                              {/*<Box padding={2}>
                                <Text muted size={1}>
                                  {release.publishAt ? (
                                    <RelativeTime time={release.publishAt as Date} useTemporalPhrase />
                                  ) : (
                                    'No target date'
                                  )}
                                </Text>
                              </Box>*/}

                              <Box padding={2}>
                                <Text size={1}>
                                  <CheckmarkIcon
                                    style={{
                                      opacity: currentGlobalBundle._id === release._id ? 1 : 0,
                                    }}
                                    data-testid={`${release._id}-checkmark-icon`}
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
