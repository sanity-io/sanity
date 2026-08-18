import {Box} from '@sanity/ui'
import {Suspense, useCallback} from 'react'
import {Resizable, usePane} from 'sanity'

import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentInspectorErrorBoundary} from './DocumentInspectorErrorBoundary'

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
  const element = (
    // Keying on the inspector name clears a caught error when switching inspectors
    <DocumentInspectorErrorBoundary key={inspector.name} onClose={handleClose}>
      <Suspense fallback={null}>
        <Component onClose={handleClose} documentId={documentId} documentType={documentType} />
      </Suspense>
    </DocumentInspectorErrorBoundary>
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
