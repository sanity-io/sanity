import {BoundaryElementProvider, Box, PortalProvider} from '@sanity/ui'
import {useCallback} from 'react'

import {usePane} from '../../../components'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {Resizable} from './Resizable'

interface DocumentInspectorPanelProps {
  documentId: string
  documentType: string
  flex?: number | number[]
  boundaryElement: HTMLElement | null
  portalElement: HTMLElement | null
}

export function DocumentInspectorPanel(
  props: DocumentInspectorPanelProps,
): React.JSX.Element | null {
  const {documentId, documentType, flex, boundaryElement, portalElement} = props
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useStructureTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  const location = inspector.location || 'aside'
  const Component = inspector.component
  const element = (
    <Component onClose={handleClose} documentId={documentId} documentType={documentType} />
  )

  if (location === 'portal') {
    return (
      <PortalProvider element={portalElement}>
        <BoundaryElementProvider element={boundaryElement}>{element}</BoundaryElementProvider>
      </PortalProvider>
    )
  }
  if (features.resizablePanes) {
    return (
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        flex={flex}
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
