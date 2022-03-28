import type React from 'react'
import {ScrollEventHandler} from './types'
interface ScrollMonitorProps {
  onScroll: ScrollEventHandler
  children?: React.ReactNode
}
export declare function ScrollMonitor({onScroll, children}: ScrollMonitorProps): JSX.Element
export {}
