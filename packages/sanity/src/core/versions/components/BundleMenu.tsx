import {CheckmarkIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuButton, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {type ReactElement, useCallback} from 'react'
import {RelativeTime} from 'sanity'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../store/bundles/types'
import {useBundle} from '../hooks/useBundle'
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

  const {currentBundle, setGlobalBundle, isDraft} = useBundle()

  const handleBundleChange = useCallback(
    (bundle: Partial<BundleDocument>) => () => {
      setGlobalBundle(bundle)
    },
    [setGlobalBundle],
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
                        .filter((b) => !isDraftOrPublished(b.name) && !b.archivedAt)
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
                                    style={{opacity: currentBundle.name === b.name ? 1 : 0}}
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
