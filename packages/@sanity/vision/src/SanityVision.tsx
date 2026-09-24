import {useCallback} from 'react'
import {type Tool, useClient} from 'sanity'

import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {type VisionConfig} from './types'
import {RedesignToast} from './vista/components/RedesignToast'
import {
  clearRedesignPreference,
  useRedesignPreference,
  writeRedesignPreference,
} from './vista/redesignPreference'
import {clearAllVistaState} from './vista/store/vistaStorage'
import {VistaContainer} from './vista/VistaContainer'

interface SanityVisionProps {
  tool: Tool<VisionConfig>
}

function SanityVision(props: SanityVisionProps) {
  const client = useClient({apiVersion: '1'})
  const config: VisionConfig = {
    defaultApiVersion: DEFAULT_API_VERSION,
    ...props.tool.options,
  }
  const projectId = client.config().projectId || 'default'
  const redesignEnabled = config.beta?.redesign?.enabled === true
  const preference = useRedesignPreference(projectId)
  const showRedesign = redesignEnabled && preference.optedIn

  const optIn = useCallback(
    () => writeRedesignPreference(projectId, {optedIn: true, dismissed: false}),
    [projectId],
  )
  const dismiss = useCallback(
    () => writeRedesignPreference(projectId, {dismissed: true}),
    [projectId],
  )
  const switchToClassic = useCallback(
    () => writeRedesignPreference(projectId, {optedIn: false, dismissed: false}),
    [projectId],
  )
  const clearRedesignCache = useCallback(() => {
    clearAllVistaState()
    clearRedesignPreference(projectId)
  }, [projectId])

  if (showRedesign) {
    return (
      <VisionErrorBoundary onClearCache={clearRedesignCache}>
        <VistaContainer client={client} config={config} onSwitchToClassic={switchToClassic} />
      </VisionErrorBoundary>
    )
  }

  return (
    <VisionErrorBoundary>
      <VisionContainer client={client} config={config} />
      {redesignEnabled && !preference.dismissed && (
        <RedesignToast onAccept={optIn} onDismiss={dismiss} />
      )}
    </VisionErrorBoundary>
  )
}

export default SanityVision
