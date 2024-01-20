import {Box, Card, Flex, LayerProvider, useElementRect} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode, useCallback, useMemo} from 'react'
import {LegacyLayerProvider} from 'sanity'

import {Layout, Root, TabsBox, TitleCard, TitleText, TitleTextSkeleton} from './PaneHeader.styles'
import {usePane} from './usePane'

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export interface PaneHeaderProps {
  actions?: ReactNode
  backButton?: ReactNode
  border?: boolean
  contentAfter?: ReactNode
  loading?: boolean
  subActions?: ReactNode
  tabIndex?: number
  tabs?: ReactNode
  title: ReactNode
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneHeader = forwardRef(function PaneHeader(
  props: PaneHeaderProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {actions, backButton, border, contentAfter, loading, subActions, tabs, tabIndex, title} =
    props
  const {collapse, collapsed, expand, rootElement: paneElement} = usePane()
  const paneRect = useElementRect(paneElement || null)

  const layoutStyle = useMemo(
    () => ({
      width: collapsed ? paneRect?.height || window.innerHeight : undefined,
    }),
    [collapsed, paneRect],
  )

  const handleTitleClick = useCallback(() => {
    if (collapsed) return
    collapse()
  }, [collapse, collapsed])

  const handleLayoutClick = useCallback(() => {
    if (!collapsed) return
    expand()
  }, [collapsed, expand])

  const showTabsOrSubActions = Boolean(!collapsed && (tabs || subActions))

  return (
    <LayerProvider zOffset={100}>
      <Root
        $border={border}
        data-collapsed={collapsed ? '' : undefined}
        data-testid="pane-header"
        ref={ref}
      >
        <LegacyLayerProvider zOffset="paneHeader">
          <Card data-collapsed={collapsed ? '' : undefined} tone="inherit">
            <Layout
              gap={1}
              onClick={handleLayoutClick}
              padding={3}
              paddingBottom={collapsed ? 3 : 2}
              sizing="border"
              style={layoutStyle}
            >
              {backButton && <Box flex="none">{backButton}</Box>}

              <TitleCard
                __unstable_focusRing
                flex={1}
                forwardedAs="button"
                onClick={handleTitleClick}
                paddingLeft={backButton ? 1 : 2}
                padding={2}
                tabIndex={tabIndex}
              >
                {loading && <TitleTextSkeleton animated radius={1} size={1} />}
                {!loading && (
                  <TitleText size={1} textOverflow="ellipsis" weight="semibold">
                    {title}
                  </TitleText>
                )}
              </TitleCard>

              {actions && (
                <Flex align="center" hidden={collapsed}>
                  <LegacyLayerProvider zOffset="paneHeader">{actions}</LegacyLayerProvider>
                </Flex>
              )}
            </Layout>

            {showTabsOrSubActions && (
              <Flex
                align="center"
                hidden={collapsed}
                overflow="auto"
                paddingBottom={3}
                paddingX={3}
              >
                <TabsBox flex={1} marginRight={subActions ? 3 : 0}>
                  {tabs}
                </TabsBox>

                {subActions && subActions}
              </Flex>
            )}

            {!collapsed && contentAfter && contentAfter}
          </Card>
        </LegacyLayerProvider>
      </Root>
    </LayerProvider>
  )
})
