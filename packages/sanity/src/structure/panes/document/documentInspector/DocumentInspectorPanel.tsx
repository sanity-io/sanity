import {Box} from '@sanity/ui'
import {Profiler, type ProfilerOnRenderCallback, useCallback} from 'react'
import {Resizable} from 'sanity'

import {usePane} from '../../../components'
import {useStructureTool} from '../../../useStructureTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {
  getDocumentPaneSubtreeRenderMeasureName,
  reportDocumentPaneRenderPerformance,
} from '../documentPanePerf'
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
  const {closeInspector, inspector, paneKey} = useDocumentPane()
  const {features} = useStructureTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  const inspectorScope = `inspector.${inspector?.name || 'none'}`
  const {paneKeyForPerf, renderMeasureName} = getDocumentPaneSubtreeRenderMeasureName(
    inspectorScope,
    paneKey,
  )

  const handleProfilerRender = useCallback(
    (...args: Parameters<ProfilerOnRenderCallback>) => {
      const [_id, phase, actualDuration, baseDuration, startTime, commitTime] = args
      reportDocumentPaneRenderPerformance({
        paneKeyForPerf,
        renderMeasureName,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      })
    },
    [paneKeyForPerf, renderMeasureName],
  )

  if (collapsed || !inspector) return null

  const Component = inspector.component
  const element = (
    <Profiler id={renderMeasureName} onRender={handleProfilerRender}>
      <Component onClose={handleClose} documentId={documentId} documentType={documentType} />
    </Profiler>
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
