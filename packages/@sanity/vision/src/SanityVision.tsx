import {useEffect, useRef} from 'react'
import {type Tool, useClient} from 'sanity'

import {useVisionTelemetry} from './__telemetry__/useVisionTelemetry'
import {DEFAULT_API_VERSION} from './apiVersions'
import {VisionContainer} from './containers/VisionContainer'
import {VisionErrorBoundary} from './containers/VisionErrorBoundary'
import {VisionRedesign} from './redesign/components/VisionRedesign'
import {type VisionConfig} from './types'

interface SanityVisionProps {
  tool: Tool<VisionConfig>
}

function SanityVision(props: SanityVisionProps) {
  const client = useClient({apiVersion: '1'})
  const config: VisionConfig = {
    defaultApiVersion: DEFAULT_API_VERSION,
    ...props.tool.options,
  }

  const telemetry = useVisionTelemetry()
  // Once per mount: an `<Activity>` reveal re-runs effects without remounting
  const openedRef = useRef(false)
  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    telemetry.opened('redesign')
  }, [telemetry])

  return (
    <VisionErrorBoundary>
      <VisionContainer client={client} config={config}>
        {(loaded) => <VisionRedesign {...loaded} config={config} />}
      </VisionContainer>
    </VisionErrorBoundary>
  )
}

export default SanityVision
