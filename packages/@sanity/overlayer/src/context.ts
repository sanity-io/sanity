import * as React from 'react'
import {Rect} from './types'

export interface RegionReporterMountEvent {
  type: 'mount'
  id: string
  element: HTMLElement
  data: any
  component: React.ComponentType
}

export interface RegionReporterUnmountEvent {
  type: 'unmount'
  id: string
}

export interface RegionReporterUpdateEvent {
  type: 'update'
  id: string
  data: any
  component: React.ComponentType
}

export type RegionReporterEvent =
  | RegionReporterMountEvent
  | RegionReporterUpdateEvent
  | RegionReporterUnmountEvent

export interface Position {
  id: string
  rect: Rect
}

interface OverlayerContext {
  dispatch: (event: RegionReporterEvent) => void
}

const DEFAULT_CONTEXT: OverlayerContext = {
  dispatch: (event: RegionReporterEvent) => {
    throw new Error('Missing context')
  }
}

export const Context: React.Context<OverlayerContext> = React.createContext(DEFAULT_CONTEXT)
