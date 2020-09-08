import * as React from 'react'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

export interface ReportedRegion<RegionData> {
  id: string
  children?: React.ReactNode
  rect: Rect
  data: RegionData
}

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

export interface OverlayReporterContext {
  dispatch: (event: RegionReporterEvent) => void
}
