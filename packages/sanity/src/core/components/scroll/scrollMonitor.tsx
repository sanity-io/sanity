import React from 'react'
import {useOnScroll} from './hooks'
import {ScrollEventHandler} from './types'

/** @internal */
export interface ScrollMonitorProps {
  onScroll: ScrollEventHandler
  children?: React.ReactNode
}

/** @internal */
export function ScrollMonitor({onScroll, children}: ScrollMonitorProps) {
  useOnScroll(onScroll)
  return <>{children}</>
}
