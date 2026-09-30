import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useRouterState} from 'sanity/router'
import {
  DocumentPane,
  type DocumentPaneNode,
  PaneLayout,
  StructureToolProvider,
} from 'sanity/structure'
import {Box, Flex} from 'ui5'

import {MinimalPaneRouterProvider} from './MinimalPaneRouterProvider'

export function EditorTool(): React.JSX.Element {
  const documentType = useRouterState((state) =>
    typeof state.type === 'string' ? state.type : undefined,
  )
  const documentId = useRouterState((state) =>
    typeof state.id === 'string' ? state.id : undefined,
  )
  const pane: DocumentPaneNode | undefined = useMemo(
    () =>
      documentId && documentType
        ? {
            id: documentId,
            type: 'document',
            title: '',
            options: {id: documentId, type: documentType},
          }
        : undefined,
    [documentId, documentType],
  )

  if (!pane) {
    return (
      <Flex alignItems="center" justifyContent="center" height="100%" padding={4}>
        <Text muted size={1}>
          Pick a story from the dashboard to start editing
        </Text>
      </Flex>
    )
  }

  return (
    <StructureToolProvider>
      <MinimalPaneRouterProvider>
        <Flex flexDirection="column" height="100%">
          <Box flexGrow={1} style={{minHeight: 0}}>
            <PaneLayout style={{height: '100%'}}>
              <DocumentPane
                paneKey={pane.id}
                index={0}
                itemId={pane.id}
                pane={pane}
                actionsPlacement="top"
              />
            </PaneLayout>
          </Box>
        </Flex>
      </MinimalPaneRouterProvider>
    </StructureToolProvider>
  )
}
