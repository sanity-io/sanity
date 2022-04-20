import React from 'react'
import {useOnScroll} from './hooks'
import {ScrollEventHandler} from './types'

export interface ScrollMonitorProps {
  onScroll: ScrollEventHandler
  children?: React.ReactNode
}

export function ScrollMonitor({onScroll, children}: ScrollMonitorProps) {
  useOnScroll(onScroll)
  return <>{children}</>
}
