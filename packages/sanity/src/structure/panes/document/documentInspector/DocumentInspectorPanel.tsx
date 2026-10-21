import {Suspense, useCallback} from 'react'
import {Resizable} from 'sanity'
import {Box} from 'ui5'

import {usePane} from '../../../components/pane/usePane'
import {useStructureTool} from '../../../useStructureTool'
import {
  DOCUMENT_INSPECTOR_MAX_WIDTH,
  DOCUMENT_INSPECTOR_MIN_WIDTH,
  DOCUMENT_INSPECTOR_TABS_MAX_WIDTH,
} from '../constants'
import {
  DocumentInspectorTabsProvider,
  useDocumentPaneExtension,
} from '../documentPanel/DocumentPaneExtension'
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
  // PROPOSED: a host's tab row sits above the inspector, and the inspectors drop their own headers while it does.
  const tabs = useDocumentPaneExtension({documentId, documentType})?.inspectorTabs
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useStructureTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  const Component = inspector.component
  const content = (
    // Keying on the inspector name clears a caught error when switching inspectors
    <DocumentInspectorErrorBoundary key={inspector.name} onClose={handleClose}>
      <Suspense fallback={null}>
        <Component onClose={handleClose} documentId={documentId} documentType={documentType} />
      </Suspense>
    </DocumentInspectorErrorBoundary>
  )

  const element = tabs ? (
    <DocumentInspectorTabsProvider value>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0}}>
        <div style={{flex: 'none'}}>{tabs}</div>
        <div style={{flex: '1 1 0%', minHeight: 0}}>{content}</div>
      </div>
    </DocumentInspectorTabsProvider>
  ) : (
    content
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
        maxWidth={tabs ? DOCUMENT_INSPECTOR_TABS_MAX_WIDTH : DOCUMENT_INSPECTOR_MAX_WIDTH}
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
