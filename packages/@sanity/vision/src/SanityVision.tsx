import {lazy, Suspense, useCallback} from 'react'
import {type Tool, useClient} from 'sanity'
import {Flex} from 'ui5'

import {DEFAULT_API_VERSION} from './apiVersions'
import {DelayedSpinner} from './components/DelayedSpinner'
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

// Keeps the redesign in its own chunk, so the classic tool never downloads it
const VistaContainer = lazy(() =>
  import('./vista/VistaContainer').then((module) => ({default: module.VistaContainer})),
)

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
        <Suspense
          fallback={
            <Flex alignItems="center" height="100%" justifyContent="center">
              <DelayedSpinner />
            </Flex>
          }
        >
          <VistaContainer client={client} config={config} onSwitchToClassic={switchToClassic} />
        </Suspense>
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
