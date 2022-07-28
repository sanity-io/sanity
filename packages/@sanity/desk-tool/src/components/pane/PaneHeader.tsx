import {LegacyLayerProvider} from '@sanity/base/components'
import {useElementRect, Box, Card, Flex, LayerProvider} from '@sanity/ui'
import React, {useMemo, useCallback, forwardRef} from 'react'
import {usePane} from './usePane'
import {
  Layout,
  Root,
  TabsBox,
  TitleBox,
  TitleTextSkeleton,
  TitleText,
  LinkIconBackground,
} from './PaneHeader.styles'
import {ReferencedDocPopover} from '../paneItem/ReferencedDocPopover'
import {ReferencedDocTooltip} from '../paneItem/ReferencedDocTooltip'

interface PaneHeaderProps {
  actions?: React.ReactNode
  backButton?: React.ReactNode
  loading?: boolean
  subActions?: React.ReactNode
  tabs?: React.ReactNode
  title: React.ReactNode
  isDocumentReferenced?: boolean
  isReferenceLoading?: boolean
}
/**
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
// eslint-disable-next-line complexity
export const PaneHeader = forwardRef(function PaneHeader(
  props: PaneHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    actions,
    backButton,
    loading,
    subActions,
    tabs,
    title,
    isDocumentReferenced,
    isReferenceLoading,
  } = props
  const {collapse, collapsed, expand, rootElement: paneElement} = usePane()
  const paneRect = useElementRect(paneElement || null)

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

  //Finne ut av dette med loading..
  const isLoading = !!isReferenceLoading || isReferenceLoading
  //console.log('loading', !isLoading)
  const showReferencePopover = !window.localStorage.getItem('showReferenceInfo_closedPopover')
  const showReferencedDocumentIndicators = !collapsed && isDocumentReferenced && !isLoading
  //console.log('show', showReferencedDocumentIndicators)

  //Spør: ikonet må loade senere
  function referenceIndicator() {
    if (showReferencedDocumentIndicators) {
      if (showReferencePopover) {
        return <ReferencedDocPopover popoverElement={<LinkIconBackground />} />
      }
      return <ReferencedDocTooltip icon={<LinkIconBackground />} />
    }
    return null
  }

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
                paddingY={3}
                paddingLeft={backButton ? 1 : 3}
              >
                {loading && <TitleTextSkeleton animated radius={1} />}
                {!loading && (
                  <Flex>
                    <TitleText tabIndex={0} textOverflow="ellipsis" weight="semibold">
                      {title}
                    </TitleText>
                    {referenceIndicator()}
                  </Flex>
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
