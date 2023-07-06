import {Path, User} from '@sanity/types'
import {Session, Status} from '../store/_legacy'

/** @internal */
export type Position = 'top' | 'bottom' | 'inside' | null

/** @internal */
export type Size = 'xsmall' | 'small' | 'medium'

/** @internal */
export type ReportedRegionWithRect<T> = T & {id: string; rect: Rect}

/** @internal */
export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: ReportedRegionWithRect<FieldPresenceData>
}

/** @internal */
export type FieldPresenceData = {
  element: HTMLElement
  presence: FormNodePresence[]
  maxAvatars: number
}

/** @internal */
export type PresentUser = {
  user: User
  status?: Status
  sessions?: Session[]
}

/** @internal */
export interface Location {
  documentId: string
  path: Path
}

/**
 * @hidden
 * @beta */
export interface FormNodePresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
}

/** @internal */
export interface Rect {
  height: number
  width: number
  top: number
  left: number
}
