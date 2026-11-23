import {type ComponentProps, useCallback} from 'react'
import {type Tool, useClient} from 'sanity'

import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionGui} from './components/VisionGui'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {RedesignToast} from './redesign/components/RedesignToast'
import {type VisionRedesign} from './redesign/components/VisionRedesign'
import {
  useCreateVisionPreferences,
  useVisionPreference,
  useVisionPreferencesReady,
  VisionPreferencesContext,
} from './redesign/preferences/VisionPreferencesContext'
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
  const preferences = useCreateVisionPreferences(projectId)
  const ready = useVisionPreferencesReady(preferences)
  const showRedesign = useVisionPreference(preferences, 'redesign') === true
  const invitationDismissed = useVisionPreference(preferences, 'redesignInvitation') === true

  const optIn = useCallback(() => {
    preferences.set('redesign', true)
    preferences.set('redesignInvitation', false)
  }, [preferences])
  const dismiss = useCallback(() => preferences.set('redesignInvitation', true), [preferences])
  const switchToClassic = useCallback(() => {
    preferences.set('redesign', false)
    preferences.set('redesignInvitation', false)
  }, [preferences])

  // The first visit waits for the stored preferences, so it does not open one experience and then
  // switch to the other
  if (!ready) return null

  return (
    <VisionPreferencesContext.Provider value={preferences}>
      <VisionErrorBoundary onRetry={visionRedesign.retry}>
        <VisionContainer client={client} config={config}>
          {(loaded) =>
            showRedesign ? (
              <VisionRedesignLoader
                {...loaded}
                config={config}
                onSwitchToClassic={switchToClassic}
              />
            ) : (
              <VisionGui {...loaded} client={client} config={config} onSwitchToRedesign={optIn} />
            )
          }
        </VisionContainer>
        {!showRedesign && !invitationDismissed && (
          <RedesignToast onAccept={optIn} onDismiss={dismiss} />
        )}
      </VisionErrorBoundary>
    </VisionPreferencesContext.Provider>
  )
}

export default SanityVision
