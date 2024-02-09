import {Box} from '@sanity/ui'
import {createElement, type ReactElement, useCallback} from 'react'

import {usePane} from '../../../components'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {Resizable} from './Resizable'

interface DocumentInspectorPanelProps {
  documentId: string
  documentType: string
  flex?: number | number[]
}

export function DocumentInspectorPanel(props: DocumentInspectorPanelProps): ReactElement | null {
  const {documentId, documentType, flex} = props
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useStructureTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  const element = createElement(inspector.component, {
    onClose: handleClose,
    documentId,
    documentType,
  })

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
