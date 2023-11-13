import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {ReactNode, useMemo} from 'react'
import {
  DeskToolProvider,
  DocumentPane,
  DocumentPaneNode,
  PaneLayout,
  PaneRouterContext,
  PaneRouterContextValue,
} from 'sanity/desk'

export default function DebugComposedDeskTool() {
  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: '',
      options: {
        id: '1311a7a6-692c-40cd-a6f9-0c939b292c11',
        type: 'simpleBlock',
      },
      type: 'document',
      title: '',
    }),
    [],
  )

  return (
    <Flex flex={1} height="fill">
      <Box flex={1}>
        <Container padding={5} sizing="border" width={0}>
          <Text muted size={1}>
            Opening nested array items within PTE should open dialogs contained within the
            DocumentPane.
          </Text>
        </Container>
      </Box>
      <Card borderLeft flex={1}>
        <DeskToolProvider>
          <PaneLayout style={{height: '100%'}}>
            <DebugPaneRouterProvider>
              <DocumentPane index={1} itemId="" pane={pane} paneKey="test" />
            </DebugPaneRouterProvider>
          </PaneLayout>
        </DeskToolProvider>
      </Card>
    </Flex>
  )
}

function DebugLink(props: any) {
  return <a data-debug="" {...props} href="#debug" />
}

function DebugPaneRouterProvider(props: {children?: ReactNode}) {
  const {children} = props

  const context: PaneRouterContextValue = useMemo(() => {
    return {
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload: {},
      params: {},
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: DebugLink,
      BackLink: DebugLink,
      ReferenceChildLink: DebugLink,
      ParameterizedLink: DebugLink,
      closeCurrentAndAfter: () => {
        console.warn('closeCurrentAndAfter')
      },
      handleEditReference: (options) => {
        console.warn('handleEditReference', options)
      },
      replaceCurrent: (pane) => {
        console.warn('replaceCurrent', pane)
      },
      closeCurrent: () => {
        console.warn('closeCurrent')
      },
      duplicateCurrent: (pane) => {
        console.warn('duplicateCurrent', pane)
      },
      setView: (viewId) => {
        console.warn('setView', viewId)
      },
      setParams: (nextParams) => {
        //
      },
      setPayload: (payload) => {
        console.warn('setPayload', payload)
      },
      navigateIntent: (intentName, intentParams, options) => {
        console.warn('navigateIntent', intentName, intentParams, options)
      },
      createPathWithParams: () => {
        return ''
      },
    }
  }, [])

  return <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
}
