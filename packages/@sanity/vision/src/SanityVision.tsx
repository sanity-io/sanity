import {type ComponentProps, useCallback, useEffect, useRef} from 'react'
import {type Tool, useClient} from 'sanity'

import {useVisionTelemetry} from './__telemetry__/useVisionTelemetry'
import {type VisionUiSwitchSource} from './__telemetry__/vision.telemetry'
import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionGui} from './components/VisionGui'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {RedesignToast} from './redesign/components/RedesignToast'
import {type VisionRedesign} from './redesign/components/VisionRedesign'
import {useRedesignPreference, writeRedesignPreference} from './redesign/redesignPreference'
import {type VisionConfig} from './types'
import {createRetryableLazy} from './util/createRetryableLazy'

// The redesign (XState, groq-js type evaluation, its own UI) only loads once someone opts in,
// and a failed load can be retried from the error boundary. Its formatter loads WebAssembly on
// first use from the `@sanity-labs/groq-wasm/lazy` entry; do not import the package entry here.
const visionRedesign = createRetryableLazy<ComponentProps<typeof VisionRedesign>>(
  () => import('./redesign/components/VisionRedesign.lazy'),
)
const VisionRedesignLoader = visionRedesign.Component

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
  const preference = useRedesignPreference(projectId)
  const showRedesign = preference.optedIn

  const telemetry = useVisionTelemetry()
  // Once per mount: an `<Activity>` reveal re-runs effects without remounting
  const openedRef = useRef(false)
  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    telemetry.opened(showRedesign ? 'redesign' : 'classic')
  }, [showRedesign, telemetry])

  const optIn = useCallback(
    (source: VisionUiSwitchSource) => {
      telemetry.uiSwitched('redesign', source)
      writeRedesignPreference(projectId, {optedIn: true, dismissed: false})
    },
    [projectId, telemetry],
  )
  const optInFromPrompt = useCallback(() => optIn('prompt'), [optIn])
  const optInFromControls = useCallback(() => optIn('controls'), [optIn])
  const dismiss = useCallback(() => {
    telemetry.redesignPromptDismissed()
    writeRedesignPreference(projectId, {dismissed: true})
  }, [projectId, telemetry])
  const switchToClassic = useCallback(
    (source?: VisionUiSwitchSource) => {
      if (source) telemetry.uiSwitched('classic', source)
      writeRedesignPreference(projectId, {optedIn: false, dismissed: false})
    },
    [projectId, telemetry],
  )

  return (
    <VisionErrorBoundary onRetry={visionRedesign.retry}>
      <VisionContainer client={client} config={config}>
        {(loaded) =>
          showRedesign ? (
            <VisionRedesignLoader {...loaded} config={config} onSwitchToClassic={switchToClassic} />
          ) : (
            <VisionGui
              {...loaded}
              client={client}
              config={config}
              onSwitchToRedesign={optInFromControls}
            />
          )
        }
      </VisionContainer>
      {!showRedesign && !preference.dismissed && (
        <RedesignToast onAccept={optInFromPrompt} onDismiss={dismiss} />
      )}
    </VisionErrorBoundary>
  )
}

export default SanityVision
