export type LocationInterceptor = (n: {path: string; cancel: () => void}) => void

export interface LocationChangeEvent {
  type: 'change'
  location: URL
}

export interface LocationSnapshotEvent {
  type: 'snapshot'
  location: URL
}

export type LocationEvent = LocationChangeEvent | LocationSnapshotEvent
