import {CheckmarkIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- MenuItem requires props, only supported by @sanity/ui
import {Box, Flex, Menu, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {memo, type ReactElement, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {MenuButton, Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {type ReleaseDocument} from '../../store/release/types'
import {usePerspective} from '../hooks'
import {LATEST} from '../util/const'
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
  releases: ReleaseDocument[] | null
  loading: boolean
  actions?: ReactElement
  perspective?: string
}

/**
 * @internal
 */
export const ReleasesMenu = memo(function ReleasesMenu(props: BundleListProps): ReactElement {
  const {releases, loading, actions, button, perspective} = props
  const {currentGlobalBundle, setPerspectiveFromRelease} = usePerspective(perspective)
  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    if (!releases) return []

    return releases.filter(({state}) => state !== 'archived')
  }, [releases])
  const hasBundles = sortedBundlesToDisplay.length > 0

  const handleReleaseChange = useCallback(
    (releaseId: string) => () => {
      setPerspectiveFromRelease(releaseId)
    },
    [setPerspectiveFromRelease],
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
                  text={LATEST.metadata.title}
                  data-testid="latest-menu-item"
                />
                {hasBundles && (
                  <>
                    <MenuDivider />
                    <StyledBox data-testid="releases-list">
                      {sortedBundlesToDisplay.map((release) => (
                        <MenuItem
                          key={release._id}
                          onClick={handleReleaseChange(release._id)}
                          padding={1}
                          pressed={false}
                          data-testid={`release-${release._id}`}
                        >
                          <Tooltip content={t('release.deleted-tooltip')} placement="bottom-start">
                            <Flex>
                              <ReleaseBadge
                                hue={release.metadata.hue}
                                icon={release.metadata.icon}
                                padding={2}
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
