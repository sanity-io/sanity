import {Path} from '@sanity/types'
import {User} from '../datastores/presence/types'

export type Position = 'top' | 'bottom' | 'inside' | null
export type Size = 'xsmall' | 'small' | 'medium'

export type ReportedRegionWithRect<T> = T & {id: string; rect: Rect}
export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: ReportedRegionWithRect<FieldPresenceData>
}

export type FieldPresenceData = {
  element: HTMLElement
  presence: FormFieldPresence[]
  maxAvatars: number
}

export interface Location {
  documentId: string
  path: Path
}

export interface FormFieldPresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
}

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}
