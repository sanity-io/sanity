import {LegacyLayerProvider} from '@sanity/base/components'
import {useElementRect, Box, Card, Flex, LayerProvider} from '@sanity/ui'
import React, {useMemo, useState, useCallback, useEffect, useRef, forwardRef} from 'react'
import {usePane} from './usePane'
import {Layout, Root, TabsBox, TitleBox, TitleTextSkeleton, TitleText} from './PaneHeader.styles'

interface PaneHeaderProps {
  actions?: React.ReactNode
  backButton?: React.ReactNode
  loading?: boolean
  subActions?: React.ReactNode
  tabs?: React.ReactNode
  title: React.ReactNode
}

/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneHeader = forwardRef(function PaneHeader(
  props: PaneHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {actions, backButton, loading, subActions, tabs, title} = props
  const {collapse, collapsed, expand, rootElement: paneElement} = usePane()
  const paneRect = useElementRect(paneElement || null)
  const collapsedRef = useRef(collapsed)
  const [actionsVisible, setActionsVisible] = useState(!collapsed)

  useEffect(() => {
    collapsedRef.current = collapsed
    if (!collapsed) return
    setActionsVisible(false)
  }, [collapsed])

  const layoutStyle = useMemo(() => {
    return {width: collapsed ? paneRect?.height || window.innerHeight : undefined}
  }, [collapsed, paneRect])

  const handleTransitionEnd = useCallback(() => {
    if (collapsedRef.current) return
    setActionsVisible(true)
  }, [])

  const handleTitleClick = useCallback(() => {
    if (collapsed) return
    collapse()
  }, [collapse, collapsed])

  const handleLayoutClick = useCallback(() => {
    if (!collapsed) return
    expand()
  }, [collapsed, expand])

  const titleBox = useMemo(
    () => (
      <TitleBox flex={1} onClick={handleTitleClick} paddingY={3} paddingLeft={backButton ? 1 : 3}>
        {loading && <TitleTextSkeleton animated radius={1} />}
        {!loading && (
          <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
            {title}
          </TitleText>
        )}
      </TitleBox>
    ),
    [backButton, handleTitleClick, loading, title]
  )

  const row2 = useMemo(
    () =>
      (tabs || subActions) && (
        <Flex
          align="center"
          hidden={collapsed}
          paddingTop={0}
          paddingRight={2}
          paddingBottom={2}
          paddingLeft={3}
        >
          <TabsBox flex={1} marginRight={subActions ? 3 : 0}>
            <div>{tabs}</div>
          </TabsBox>

          {subActions && <Box>{subActions}</Box>}
        </Flex>
      ),
    [collapsed, subActions, tabs]
  )

  const layout = useMemo(
    () => (
      <Layout
        onTransitionEnd={handleTransitionEnd}
        onClick={handleLayoutClick}
        padding={2}
        paddingBottom={tabs || subActions ? 1 : 2}
        sizing="border"
        style={layoutStyle}
      >
        {backButton}

        {titleBox}

        {actions && (
          <Box hidden={!actionsVisible} paddingLeft={1}>
            <LegacyLayerProvider zOffset="paneHeader">{actions}</LegacyLayerProvider>
          </Box>
        )}
      </Layout>
    ),
    [
      actions,
      actionsVisible,
      backButton,
      handleLayoutClick,
      handleTransitionEnd,
      layoutStyle,
      subActions,
      tabs,
      titleBox,
    ]
  )

  return useMemo(
    () => (
      <LayerProvider zOffset={100}>
        <Root data-collapsed={collapsed ? '' : undefined} data-testid="pane-header" ref={ref}>
          <LegacyLayerProvider zOffset="paneHeader">
            <Card data-collapsed={collapsed ? '' : undefined} tone="inherit">
              {layout}
              {row2}
            </Card>
          </LegacyLayerProvider>
        </Root>
      </LayerProvider>
    ),
    [collapsed, layout, ref, row2]
  )
})
