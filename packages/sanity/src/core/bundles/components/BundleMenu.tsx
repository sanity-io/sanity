import {CheckmarkIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuButton, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {type ReactElement, useCallback} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../store/bundles/types'
import {usePerspective} from '../hooks'
import {LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/util'
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
  perspective?: string
}

/**
 * @internal
 */
export function BundleMenu(props: BundleListProps): JSX.Element {
  const {bundles, loading, actions, button, perspective} = props
  const {currentGlobalBundle, setPerspective} = usePerspective(perspective)

  const bundlesToDisplay =
    bundles?.filter((bundle) => !isDraftOrPublished(bundle.slug) && !bundle.archivedAt) || []
  const hasBundles = bundlesToDisplay.length > 0

  const handleBundleChange = useCallback(
    (bundle: Partial<BundleDocument>) => () => {
      if (bundle.slug) {
        setPerspective(bundle.slug)
      }
    },
    [setPerspective],
  )

  return (
    <>
      <MenuButton
        button={button}
        id="bundle-menu"
        menu={
          <StyledMenu data-testid="bundle-menu">
            {loading ? (
              <Flex padding={4} justify="center" data-testid="spinner">
                <Spinner muted />
              </Flex>
            ) : (
              <>
                <MenuItem
                  iconRight={
                    currentGlobalBundle.slug === LATEST.slug ? (
                      <CheckmarkIcon data-testid="latest-checkmark-icon" />
                    ) : undefined
                  }
                  onClick={handleBundleChange(LATEST)}
                  pressed={false}
                  text={LATEST.title}
                  data-testid="latest-menu-item"
                />
                {hasBundles && (
                  <>
                    <MenuDivider />
                    <StyledBox data-testid="bundles-list">
                      {bundlesToDisplay.map((bundle) => (
                        <MenuItem
                          key={bundle.slug}
                          onClick={handleBundleChange(bundle)}
                          padding={1}
                          pressed={false}
                          data-testid={`bundle-${bundle.slug}`}
                        >
                          <Flex>
                            <BundleBadge hue={bundle.hue} icon={bundle.icon} padding={2} />

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
                                    opacity: currentGlobalBundle.slug === bundle.slug ? 1 : 0,
                                  }}
                                  data-testid={`${bundle.slug}-checkmark-icon`}
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
