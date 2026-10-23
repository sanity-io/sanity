import {Suspense, useCallback} from 'react'
import {Resizable} from 'sanity'
import {keyframes, styled} from 'styled-components'
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

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

/** PROPOSED: with a host tab row, a switched panel eases in instead of jumping. Keyed by the inspector, so it replays on every switch. */
const PanelFade = styled.div`
  flex: 1 1 0%;
  min-height: 0;
  animation: ${fadeIn} 200ms cubic-bezier(0.2, 0, 0, 1);
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

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
  const extension = useDocumentPaneExtension({documentId, documentType})
  const tabs = extension?.inspectorTabs
  const {collapsed, rootElement} = usePane()
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
        <PanelFade key={inspector.name}>{content}</PanelFade>
      </div>
    </DocumentInspectorTabsProvider>
  ) : (
    content
  )

  if (features.resizablePanes) {
    const maxWidth = tabs ? DOCUMENT_INSPECTOR_TABS_MAX_WIDTH : DOCUMENT_INSPECTOR_MAX_WIDTH
    // PROPOSED: the host sees the pane's width, so it can open narrower in a narrow pane (Presentation, a split pane).
    const wanted = extension?.inspectorInitialWidth?.(inspector.name, rootElement?.offsetWidth)
    const initialWidth =
      wanted === undefined
        ? undefined
        : Math.min(Math.max(wanted, DOCUMENT_INSPECTOR_MIN_WIDTH), maxWidth)
    return (
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        {...(flex !== undefined && {
          flexGrow: flex,
          flexBasis: '0%',
        })}
        resizerPosition="left"
        initialWidth={initialWidth}
        maxWidth={maxWidth}
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
