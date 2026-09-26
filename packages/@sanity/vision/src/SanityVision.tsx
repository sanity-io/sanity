import {type ComponentProps, lazy, useCallback} from 'react'
import {type Tool, useClient} from 'sanity'

import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionGui} from './components/VisionGui'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {type VisionConfig} from './types'
import {RedesignToast} from './vista/components/RedesignToast'
import {type VistaGui} from './vista/components/VistaGui'
import {useRedesignPreference, writeRedesignPreference} from './vista/redesignPreference'

type VistaGuiModule = {default: typeof VistaGui}

// The redesign (XState, groq-js type evaluation, its own UI) only loads once someone opts in.
// `lazy()` remembers a rejected import for good, so a failed load swaps in a fresh lazy
// component: the error boundary's Retry then gets another attempt at the chunk instead of the
// cached rejection. (The component must live at module level: a mounting render that suspends
// is thrown away with its state, so one created in `useState` would never settle.)
let LazyVistaGui = lazy(loadVistaGui)

function loadVistaGui(): Promise<VistaGuiModule> {
  return import('./vista/components/VistaGui')
    .then((module) => ({default: module.VistaGui}))
    .catch((error: unknown) => {
      LazyVistaGui = lazy(loadVistaGui)
      throw error
    })
}

function VistaGuiLoader(props: ComponentProps<typeof VistaGui>) {
  const Component = LazyVistaGui
  return <Component {...props} />
}

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
    <VisionErrorBoundary>
      <VisionContainer client={client} config={config}>
        {(loaded) =>
          showRedesign ? (
            <VistaGuiLoader {...loaded} config={config} onSwitchToClassic={switchToClassic} />
          ) : (
            <VisionGui {...loaded} client={client} config={config} />
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
