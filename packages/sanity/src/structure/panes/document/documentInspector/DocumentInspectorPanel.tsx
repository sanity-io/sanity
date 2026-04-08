import {Box} from '@sanity/ui'
import {useCallback} from 'react'
import {DivergencesProvider, Resizable} from 'sanity'

import {usePane} from '../../../components'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'

interface DocumentInspectorPanelProps {
  documentId: string
  documentType: string
  flex?: number | number[]
}

export function DocumentInspectorPanel(
  props: DocumentInspectorPanelProps,
): React.JSX.Element | null {
  const {documentId, documentType, flex} = props
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useStructureTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  const Component = inspector.component

  // No document/form shown in an inspector (e.g. a task, or AI assist
  // instruction) is expected to support divergences itself. Therefore,
  // divergences are switched off for the entire inspector subtree, regardless
  // of whether the workspace has switched them on.
  //
  // This prevents redundant form gutters being rendered in the already
  // limited space available to inspectors.
  const element = (
    <DivergencesProvider enabled={false}>
      <Component onClose={handleClose} documentId={documentId} documentType={documentType} />
    </DivergencesProvider>
  )

  if (features.resizablePanes) {
    return (
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        flex={flex}
        resizerPosition="left"
        maxWidth={DOCUMENT_INSPECTOR_MAX_WIDTH}
        minWidth={DOCUMENT_INSPECTOR_MIN_WIDTH}
      >
        {element}
      </Resizable>
    )
  }

  return (
    <Box as="aside" data-ui="DocumentInspectorPanel" flex={flex}>
      {element}
    </Box>
  )
}
