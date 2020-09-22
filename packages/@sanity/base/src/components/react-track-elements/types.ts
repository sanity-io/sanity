import * as React from 'react'

export type DelegateComponentType<Data> = React.ComponentType<Data> | keyof React.ReactHTML

export interface ReportedRegion<RegionData> {
  id: string
  children?: React.ReactNode
  element: HTMLElement
  data: RegionData
}

export interface RegionReporterMountEvent {
  type: 'mount'
  id: string
  element: HTMLElement
  data: any
  component: React.ComponentType | keyof React.ReactHTML
}

export interface RegionReporterUnmountEvent {
  type: 'unmount'
  id: string
}

export interface RegionReporterUpdateEvent {
  type: 'update'
  id: string
  data: any
  component: React.ComponentType | keyof React.ReactHTML
}

export type RegionReporterEvent =
  | RegionReporterMountEvent
  | RegionReporterUpdateEvent
  | RegionReporterUnmountEvent

export interface OverlayReporterContext {
  dispatch: (event: RegionReporterEvent) => void
}
