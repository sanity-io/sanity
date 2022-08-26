import {LegacyLayerProvider} from '@sanity/base/components'
import {useElementRect, Box, Card, Flex, LayerProvider} from '@sanity/ui'
import React, {useMemo, useCallback, forwardRef} from 'react'
import {ReferencedDocHeading} from '../paneItem/ReferencedDocHeading'
import {usePane} from './usePane'
import {Layout, Root, TabsBox, TitleBox, TitleTextSkeleton, TitleText} from './PaneHeader.styles'

interface PaneHeaderProps {
  actions?: React.ReactNode
  backButton?: React.ReactNode
  loading?: boolean
  subActions?: React.ReactNode
  tabs?: React.ReactNode
  title: React.ReactNode
  totalReferenceCount?: number
}
/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
// eslint-disable-next-line complexity
export const PaneHeader = forwardRef(function PaneHeader(
  props: PaneHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {actions, backButton, loading, subActions, tabs, title, totalReferenceCount} = props
  const {collapse, collapsed, expand, rootElement: paneElement} = usePane()
  const paneRect = useElementRect(paneElement || null)
  const isDocumentReferenced = totalReferenceCount !== undefined && totalReferenceCount > 0

  const layoutStyle = useMemo(
    () => ({
      width: collapsed ? paneRect?.height || window.innerHeight : undefined,
    }),
    [collapsed, paneRect]
  )

  const handleTitleClick = useCallback(() => {
    if (collapsed) return
    collapse()
  }, [collapse, collapsed])

  const handleLayoutClick = useCallback(() => {
    if (!collapsed) return
    expand()
  }, [collapsed, expand])

  const showReferencedDocumentIndicators = !collapsed && isDocumentReferenced

  return (
    <LayerProvider zOffset={100}>
      <Root data-collapsed={collapsed ? '' : undefined} data-testid="pane-header" ref={ref}>
        <LegacyLayerProvider zOffset="paneHeader">
          <Card
            data-collapsed={collapsed ? '' : undefined}
            tone={showReferencedDocumentIndicators ? 'primary' : 'inherit'}
          >
            <Layout
              onClick={handleLayoutClick}
              padding={2}
              paddingBottom={tabs || subActions ? 1 : 2}
              sizing="border"
              style={layoutStyle}
            >
              {backButton}

              <TitleBox
                flex={1}
                onClick={handleTitleClick}
                paddingLeft={backButton ? 1 : 3}
                paddingTop={3}
              >
                {loading && <TitleTextSkeleton animated radius={1} />}
                {!loading && showReferencedDocumentIndicators ? (
                  <ReferencedDocHeading totalReferenceCount={totalReferenceCount} title={title} />
                ) : (
                  <Box paddingBottom={3}>
                    <TitleText textOverflow="ellipsis" weight="semibold">
                      {title}
                    </TitleText>
                  </Box>
                )}
              </TitleBox>

              {actions && (
                <Box hidden={collapsed} paddingLeft={1}>
                  <LegacyLayerProvider zOffset="paneHeader">{actions}</LegacyLayerProvider>
                </Box>
              )}
            </Layout>

            {(tabs || subActions) && (
              <Flex
                align="center"
                hidden={collapsed}
                paddingTop={0}
                paddingRight={2}
                paddingBottom={2}
                paddingLeft={3}
                overflow="auto"
              >
                <TabsBox flex={1} marginRight={subActions ? 3 : 0}>
                  <div>{tabs}</div>
                </TabsBox>

                {subActions && <Box>{subActions}</Box>}
              </Flex>
            )}
          </Card>
        </LegacyLayerProvider>
      </Root>
    </LayerProvider>
  )
})
