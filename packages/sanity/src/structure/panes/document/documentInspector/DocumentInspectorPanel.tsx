import {Suspense, useCallback} from 'react'
import {Resizable} from 'sanity'
import {Box} from 'ui5'

import {usePane} from '../../../components/pane/usePane'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentInspectorErrorBoundary} from './DocumentInspectorErrorBoundary'

interface DocumentInspectorPanelProps {
  documentId: string
  documentType: string
  flex?: number
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
        {...(flex !== undefined && {
          flexGrow: flex,
          flexBasis: '0%',
        })}
        resizerPosition="left"
        maxWidth={DOCUMENT_INSPECTOR_MAX_WIDTH}
        minWidth={DOCUMENT_INSPECTOR_MIN_WIDTH}
      >
        {element}
      </Resizable>
    )
  }

  return (
    <Box as="aside" data-ui="DocumentInspectorPanel" flexBasis="0%" flexGrow={flex}>
      {element}
    </Box>
  )
}
