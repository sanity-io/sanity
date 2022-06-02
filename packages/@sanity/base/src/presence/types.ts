import {Path, User} from '@sanity/types'
import {Session, Status} from '../datastores/presence/types'
import {NodePresence} from '../form'

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
  presence: NodePresence[]
  maxAvatars: number
}

export type PresentUser = {
  user: User
  status?: Status
  sessions?: Session[]
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
