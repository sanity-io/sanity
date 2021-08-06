import {Path} from '_self_'
import {Session, Status, User} from '../datastores/presence/types'
export declare type Position = 'top' | 'bottom' | 'inside' | null
export declare type Size = 'xsmall' | 'small' | 'medium'
export declare type ReportedRegionWithRect<T> = T & {
  id: string
  rect: Rect
}
export declare type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: ReportedRegionWithRect<FieldPresenceData>
}
export declare type FieldPresenceData = {
  element: HTMLElement
  presence: FormFieldPresence[]
  maxAvatars: number
}
export declare type PresentUser = {
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
