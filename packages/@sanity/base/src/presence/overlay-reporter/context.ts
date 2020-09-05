import * as React from 'react'
import {Rect} from './types'

export interface RegionReporterMountEvent {
  type: 'mount'
  id: string
  element?: HTMLElement
  data: any
  component: React.ComponentType<any>
}

export interface RegionReporterUnmountEvent {
  type: 'unmount'
  id: string
}

export interface RegionReporterUpdateEvent {
  type: 'update'
  id: string
  data: any
  component: React.ComponentType<any>
}

export type RegionReporterEvent =
  | RegionReporterMountEvent
  | RegionReporterUpdateEvent
  | RegionReporterUnmountEvent

export interface Position {
  id: string
  rect: Rect
}

interface OverlayReporterContext {
  dispatch: (event: RegionReporterEvent) => void
}

const DEFAULT_CONTEXT: OverlayReporterContext = {
  dispatch: (event: RegionReporterEvent) => {
    throw new Error(
      'Tried to report a region without being wrapped in a context provider to handle it. Please make sure the component is wrapped in a <Overlay> component.'
    )
  }
}

export const Context: React.Context<OverlayReporterContext> = React.createContext(DEFAULT_CONTEXT)
