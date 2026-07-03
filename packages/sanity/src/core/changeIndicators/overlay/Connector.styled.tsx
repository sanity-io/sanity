import {type ComponentProps} from 'react'

import {ClampedRect} from './ClampedRect'
import {connectorPath, debugRect, interactivePath, rightBarWrapper} from './Connector.css'

export function DebugRect(props: ComponentProps<'rect'>) {
  return <rect {...props} className={debugRect} />
}

export function ConnectorPath(props: ComponentProps<'path'>) {
  return <path {...props} className={connectorPath} />
}

export function InteractivePath(props: ComponentProps<'path'>) {
  return <path {...props} className={interactivePath} />
}

export function RightBarWrapper(props: ComponentProps<typeof ClampedRect>) {
  return <ClampedRect {...props} className={rightBarWrapper} />
}
