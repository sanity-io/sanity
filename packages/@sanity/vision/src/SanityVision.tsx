import React from 'react'
import {type Tool, useClient} from 'sanity'
import {type VisionConfig} from './types'
import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'

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
      <VisionContainer client={client} config={config} />
    </VisionErrorBoundary>
  )
}

export default SanityVision
