import {useElementRect, Box, Card, Flex, LayerProvider} from '@sanity/ui'
import React, {useMemo, useCallback, forwardRef} from 'react'
import {usePane} from './usePane'
import {Layout, Root, TabsBox, TitleCard, TitleTextSkeleton, TitleText} from './PaneHeader.styles'
import {LegacyLayerProvider} from 'sanity'

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export interface PaneHeaderProps {
  actions?: React.ReactNode
  backButton?: React.ReactNode
  border?: boolean
  contentAfter?: React.ReactNode
  loading?: boolean
  subActions?: React.ReactNode
  tabIndex?: number
  tabs?: React.ReactNode
  title: React.ReactNode
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneHeader = forwardRef(function PaneHeader(
  props: PaneHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>,
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
