import {Box, Card, Flex, Layer, LayerProvider, TextSkeleton, Text, useElementRect} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode, useCallback, useMemo} from 'react'
import {LegacyLayerProvider} from 'sanity'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {root, layout, titleCard, titleText, titleTextSkeleton, borderColorVar} from './PaneHeader.css'
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
  appendTitle?: ReactNode
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
  const {
    actions,
    backButton,
    border,
    contentAfter,
    loading,
    subActions,
    tabs,
    tabIndex,
    title,
    appendTitle,
  } = props
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
      <Layer
        className={root}
        style={assignInlineVars({
          [borderColorVar]: border ? 'var(--card-border-color)' : 'transparent',
        })}
        data-collapsed={collapsed ? '' : undefined}
        data-testid="pane-header"
        ref={ref}
      >
        <LegacyLayerProvider zOffset="paneHeader">
          <Card data-collapsed={collapsed ? '' : undefined} tone="inherit">
            <Flex
              className={layout}
              direction="column"
              gap={3}
              onClick={handleLayoutClick}
              padding={3}
              sizing="border"
              style={layoutStyle}
            >
              <Flex align="flex-start" gap={3}>
                {backButton && <Box flex="none">{backButton}</Box>}

                <Card
                  className={titleCard}
                  __unstable_focusRing
                  flex={1}
                  onClick={handleTitleClick}
                  paddingLeft={backButton ? 1 : 2}
                  padding={2}
                  tabIndex={tabIndex}
                >
                  {loading && (
                    <Box>
                      <TextSkeleton className={titleTextSkeleton} animated radius={1} size={1} />
                    </Box>
                  )}
                  {!loading && (
                    <Flex align="center" gap={1}>
                      <Text className={titleText} size={1} textOverflow="ellipsis" weight="semibold">
                        {title}
                      </Text>
                      {appendTitle}
                    </Flex>
                  )}
                </Card>

                {actions && (
                  <Box hidden={collapsed}>
                    <LegacyLayerProvider zOffset="paneHeader">{actions}</LegacyLayerProvider>
                  </Box>
                )}
              </Flex>

              {showTabsOrSubActions && (
                <Flex align="center" hidden={collapsed} overflow="auto">
                  <Box flex={1} marginRight={subActions ? 3 : 0}>
                    {tabs}
                  </Box>

                  {subActions}
                </Flex>
              )}
            </Flex>

            {!collapsed && contentAfter}
          </Card>
        </LegacyLayerProvider>
      </Layer>
    </LayerProvider>
  )
})
