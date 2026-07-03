import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {ClampedRect} from './ClampedRect'
import {connectorPath, debugRect, interactivePath, rightBarWrapper} from './Connector.css'

export function DebugRect(props: ComponentProps<'rect'>) {
  const {className, ...restProps} = props

  return <rect {...restProps} className={clsx(debugRect, className)} />
}

export function ConnectorPath(props: ComponentProps<'path'>) {
  const {className, ...restProps} = props

  return <path {...restProps} className={clsx(connectorPath, className)} />
}

export function InteractivePath(props: ComponentProps<'path'>) {
  const {className, ...restProps} = props

  return <path {...restProps} className={clsx(interactivePath, className)} />
}

export function RightBarWrapper(props: ComponentProps<typeof ClampedRect>) {
  const {className, ...restProps} = props

  return <ClampedRect {...restProps} className={clsx(rightBarWrapper, className)} />
}
