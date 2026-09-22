import {type Tool, useClient} from 'sanity'

import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {type VisionConfig} from './types'
import {VistaContainer} from './vista/VistaContainer'

interface SanityVistaProps {
  tool: Tool<VisionConfig>
}

function SanityVista(props: SanityVistaProps) {
  const client = useClient({apiVersion: '1'})
  const config: VisionConfig = {
    defaultApiVersion: DEFAULT_API_VERSION,
    ...props.tool.options,
  }

  return (
    <VisionErrorBoundary>
      <VistaContainer client={client} config={config} />
    </VisionErrorBoundary>
  )
}

export default SanityVista
