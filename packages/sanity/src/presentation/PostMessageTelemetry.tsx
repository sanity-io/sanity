import {useTelemetry} from '@sanity/telemetry/react'
import {type FC, memo, useEffect} from 'react'

import {type VisualEditingConnection} from './types'

export interface PostMessageTelemetryProps {
  comlink: VisualEditingConnection
}

const PostMessageTelemetry: FC<PostMessageTelemetryProps> = (props) => {
  const {comlink} = props

  const telemetry = useTelemetry()

  useEffect(() => {
    return comlink.on('visual-editing/telemetry-log', async (message) => {
      const {event, data} = message

      // SANITY_STUDIO_DEBUG_TELEMETRY ensures noop/in-browser logging for telemetry events
      // eslint-disable-next-line no-unused-expressions
      data ? telemetry.log(event, data) : telemetry.log(event)
    })
  }, [comlink, telemetry])

  return null
}
export default memo(PostMessageTelemetry)
