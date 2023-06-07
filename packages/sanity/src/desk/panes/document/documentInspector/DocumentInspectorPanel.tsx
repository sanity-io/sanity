import React, {ReactElement, createElement, useCallback} from 'react'
import {Box} from '@sanity/ui'
import {usePane} from '../../../components'
import {useDeskTool} from '../../../useDeskTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {Resizable} from './Resizable'

export function DocumentInspectorPanel(props: {flex?: number}): ReactElement | null {
  const {flex} = props
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useDeskTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  if (features.resizablePanes) {
    return (
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        flex={flex}
        maxWidth={DOCUMENT_INSPECTOR_MAX_WIDTH}
        minWidth={DOCUMENT_INSPECTOR_MIN_WIDTH}
      >
        {createElement(inspector.component, {onClose: handleClose})}
      </Resizable>
    )
  }

  return (
    <Box as="aside" data-ui="DocumentInspectorPanel" flex={flex}>
      {createElement(inspector.component, {onClose: handleClose})}
    </Box>
  )
}
