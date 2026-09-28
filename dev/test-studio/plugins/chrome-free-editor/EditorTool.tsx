import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useRouterState} from 'sanity/router'
import {
  DocumentPane,
  type DocumentPaneNode,
  PaneLayout,
  StructureToolProvider,
} from 'sanity/structure'

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
      <Flex align="center" justify="center" height="fill" padding={4}>
        <Text muted size={1}>
          Search for an article to start editing
        </Text>
      </Flex>
    )
  }

  return (
    <StructureToolProvider documentChrome={false}>
      <PaneLayout style={{height: '100%'}}>
        <MinimalPaneRouterProvider>
          <DocumentPane paneKey={pane.id} index={0} itemId={pane.id} pane={pane} />
        </MinimalPaneRouterProvider>
      </PaneLayout>
    </StructureToolProvider>
  )
}
