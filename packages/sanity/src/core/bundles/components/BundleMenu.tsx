import {CheckmarkIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuButton, MenuDivider, MenuItem, Spinner, Text} from '@sanity/ui'
import {type ReactElement, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {type BundleDocument} from '../../store/bundles/types'
import {useBundles} from '../../store/bundles/useBundles'
import {usePerspective} from '../hooks/usePerspective'
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
}

/**
 * @internal
 */
export function BundleMenu(props: BundleListProps): JSX.Element {
  const {bundles, loading, actions, button} = props
  const {deletedBundles} = useBundles()
  const {currentGlobalBundle, setPerspective} = usePerspective()
  const {t} = useTranslation()

  const sortedBundlesToDisplay = useMemo(() => {
    const deletedBundlesArray = Object.values(deletedBundles).map((bundle) => ({
      ...bundle,
      isDeleted: true,
    }))
    const allBundles: (BundleDocument & {isDeleted?: boolean})[] = [
      ...(bundles || []),
      ...deletedBundlesArray,
    ]

    return allBundles
      .filter((bundle) => !isDraftOrPublished(bundle.slug) && !bundle.archivedAt)
      .sort(
        ({isDeleted: aIsDeleted = false}, {isDeleted: bIsDeleted = false}) =>
          Number(aIsDeleted) - Number(bIsDeleted),
      )
  }, [bundles, deletedBundles])
  const hasBundles = sortedBundlesToDisplay.length > 0

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
                      {sortedBundlesToDisplay.map((bundle) => (
                        <MenuItem
                          key={bundle.slug}
                          onClick={handleBundleChange(bundle)}
                          padding={1}
                          pressed={false}
                          disabled={bundle.isDeleted}
                          data-testid={`bundle-${bundle.slug}`}
                        >
                          <Tooltip
                            disabled={!bundle.isDeleted}
                            content={t('bundle.deleted-tooltip')}
                            placement="bottom-start"
                          >
                            <Flex>
                              <BundleBadge
                                hue={bundle.hue}
                                icon={bundle.icon}
                                padding={2}
                                isDisabled={bundle.isDeleted}
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
                                      opacity: currentGlobalBundle.slug === bundle.slug ? 1 : 0,
                                    }}
                                    data-testid={`${bundle.slug}-checkmark-icon`}
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
}
