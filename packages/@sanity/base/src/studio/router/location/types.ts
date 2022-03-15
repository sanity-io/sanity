import {Location} from './utils/location'

export type LocationInterceptor = (n: {path: string; cancel: () => void}) => void

export interface LocationChangeEvent {
  type: 'change'
  location: Location
}

export interface LocationSnapshotEvent {
  type: 'snapshot'
  location: Location
}

export type LocationEvent = LocationChangeEvent | LocationSnapshotEvent
