import {type Tool, useClient} from 'sanity'

import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionGui} from './components/VisionGui'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {type VisionConfig} from './types'

// The redesign (`./redesign`) is switched off for everyone, whatever `beta.redesign.enabled` says:
// its `@sanity-labs/groq-wasm` dependency breaks in some browsers. Nothing outside `./redesign` may
// import from it, so neither the redesign nor the WebAssembly module end up in the bundle. To
// restore it, bring back the experience switch from #14894 here and in `SanityVision.test.tsx`.

interface SanityVisionProps {
  tool: Tool<VisionConfig>
}

function SanityVision(props: SanityVisionProps) {
  const client = useClient({apiVersion: '1'})
  const config: VisionConfig = {
    defaultApiVersion: DEFAULT_API_VERSION,
    ...props.tool.options,
  }

  return (
    <VisionErrorBoundary>
      <VisionContainer client={client} config={config}>
        {(loaded) => <VisionGui {...loaded} client={client} config={config} />}
      </VisionContainer>
    </VisionErrorBoundary>
  )
}

export default SanityVision
