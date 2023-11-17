import {useElementRect, Box, Card, Flex, LayerProvider} from '@sanity/ui'
import React, {useMemo, useCallback, forwardRef, useEffect, useState} from 'react'
import {usePane} from './usePane'
import {Layout, Root, TabsBox, TitleCard, TitleTextSkeleton, TitleText} from './PaneHeader.styles'
import {LegacyLayerProvider} from 'sanity'

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export interface PaneHeaderProps {
  actions?: React.ReactNode
  backButton?: React.ReactNode
  borderBottom?: boolean
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
  const {
    actions,
    backButton,
    borderBottom,
    contentAfter,
    loading,
    subActions,
    tabs,
    tabIndex,
    title,
  } = props
  const {collapse, collapsed, expand, rootElement: paneElement, scrollableElement} = usePane()
  const paneRect = useElementRect(paneElement || null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [hasScrolledFromTop, setHasScrolledFromTop] = useState(false)

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

  /*   Used for conditionally rendering border on bottom of the header  */
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement

    setIsScrollable(target.scrollHeight > target.clientHeight)
    setHasScrolledFromTop(target.scrollTop > 0)
  }, [])

  useEffect(() => {
    scrollableElement?.addEventListener('scroll', handleScroll)
    return () => {
      scrollableElement?.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, scrollableElement])

  return (
    <LayerProvider zOffset={100}>
      <Root
        $borderBottom={borderBottom}
        data-collapsed={collapsed ? '' : undefined}
        data-testid="pane-header"
        ref={ref}
        //Render shadow conditionally if list is scrollable and has scrolled from top
        $shadowBottom={isScrollable && hasScrolledFromTop}
      >
        <LegacyLayerProvider zOffset="paneHeader">
          <Card data-collapsed={collapsed ? '' : undefined} tone="inherit">
            <Layout onClick={handleLayoutClick} padding={2} sizing="border" style={layoutStyle}>
              {backButton && (
                <Box flex="none" padding={1}>
                  {backButton}
                </Box>
              )}

              <TitleCard
                __unstable_focusRing
                flex={1}
                forwardedAs="button"
                marginRight={actions ? 1 : 0}
                onClick={handleTitleClick}
                paddingLeft={backButton ? 1 : 3}
                paddingY={3}
                tabIndex={tabIndex}
              >
                {loading && <TitleTextSkeleton animated radius={1} size={1} />}
                {!loading && (
                  <TitleText size={1} textOverflow="ellipsis" weight="medium">
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
                paddingTop={1}
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
