import {CheckmarkIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuButton, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {type ReactElement, useCallback, useContext} from 'react'
import {RelativeTime} from 'sanity'
import {styled} from 'styled-components'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../_singletons/core/form/VersionContext'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/dummyGetters'
import {BundleBadge} from './BundleBadge'

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
}

export function BundleMenu(props: BundleListProps): JSX.Element {
  const {bundles, loading, actions, button} = props

  // eslint-disable-next-line no-warning-comments
  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {currentVersion, setCurrentVersion, isDraft} =
    useContext<VersionContextValue>(VersionContext)

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const handleBundleChange = useCallback(
    (bundle: Partial<BundleDocument>) => () => {
      setCurrentVersion(bundle)
    },
    [setCurrentVersion],
  )

  return (
    <>
      <MenuButton
        button={button}
        id="global-version-menu"
        menu={
          <StyledMenu>
            {loading ? (
              <Flex padding={4} justify="center">
                <Spinner muted />
              </Flex>
            ) : (
              <>
                <MenuItem
                  iconRight={isDraft ? <CheckmarkIcon /> : undefined}
                  onClick={handleBundleChange(LATEST)}
                  pressed={false}
                  text={LATEST.title}
                />
                {bundles && bundles.length > 0 && (
                  <>
                    <MenuDivider />
                    <StyledBox>
                      {bundles
                        .filter((b) => !isDraftOrPublished(b.name) && !b.archived)
                        .map((b) => (
                          <MenuItem
                            key={b.name}
                            onClick={handleBundleChange(b)}
                            padding={1}
                            pressed={false}
                          >
                            <Flex>
                              <BundleBadge hue={b.hue} icon={b.icon} padding={2} />

                              <Box flex={1} padding={2} style={{minWidth: 100}}>
                                <Text size={1} weight="medium">
                                  {b.title}
                                </Text>
                              </Box>

                              <Box padding={2}>
                                <Text muted size={1}>
                                  {b.publishAt ? (
                                    <RelativeTime time={b.publishAt as Date} useTemporalPhrase />
                                  ) : (
                                    /* localize text */
                                    <span>{'No target date'}</span>
                                  )}
                                </Text>
                              </Box>

                              <Box padding={2}>
                                <Text size={1}>
                                  <CheckmarkIcon
                                    style={{opacity: currentVersion.name === b.name ? 1 : 0}}
                                  />
                                </Text>
                              </Box>
                            </Flex>
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
}
