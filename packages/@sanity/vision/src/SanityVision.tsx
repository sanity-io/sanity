import {type ComponentProps, useCallback} from 'react'
import {type Tool, useClient} from 'sanity'

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
// and a failed load can be retried from the error boundary
const visionRedesign = createRetryableLazy<ComponentProps<typeof VisionRedesign>>(() =>
  import('./redesign/components/VisionRedesign').then((module) => ({
    default: module.VisionRedesign,
  })),
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
              onSwitchToRedesign={redesignEnabled ? optIn : undefined}
            />
          )
        }
      </VisionContainer>
      {redesignEnabled && !showRedesign && !preference.dismissed && (
        <RedesignToast onAccept={optIn} onDismiss={dismiss} />
      )}
    </VisionErrorBoundary>
  )
}

export default SanityVision
