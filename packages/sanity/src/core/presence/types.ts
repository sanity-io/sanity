import {type EditorSelection} from '@portabletext/editor'
import {type Path, type User} from '@sanity/types'

import {type Session, type Status} from '../store/presence/types'

/** @internal */
export type Position = 'top' | 'bottom' | 'inside' | null

/** @internal */
export type Size = 'xsmall' | 'small' | 'medium'

/** @internal */
export type ReportedRegionWithRect<T> = T & {
  id: string
  rect: Rect
  /**
   * Set when the reported element is scrolled out of its `clipElement`: `rect` is then the spot
   * at the top or bottom edge of the clip element where the presence is shown instead.
   */
  clampedTo?: 'top' | 'bottom'
}

/** @internal */
export type RegionWithIntersectionDetails = {
  distanceTop: number
  distanceBottom: number
  position: 'top' | 'bottom' | 'inside'
  region: ReportedRegionWithRect<FieldPresenceData>
}

/** @internal */
export type FieldPresenceData = {
  element: HTMLElement | null
  presence: FormNodePresence[]
  maxAvatars: number
  /**
   * The presence is already rendered inline at `element` (e.g. a Portable Text cursor),
   * so the overlay only renders it when the element is out of view.
   */
  inline?: boolean
  /**
   * A scroll container between `element` and the overlay that can hide `element` (e.g. the
   * Portable Text editor's scroller). When `element` is scrolled out of it, the presence is shown
   * at the top or bottom edge of this element instead.
   */
  clipElement?: HTMLElement | null
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
 * @public */
export interface FormNodePresence {
  user: User
  path: Path
  sessionId: string
  lastActiveAt: string
  selection?: EditorSelection
}

/** @internal */
export interface Rect {
  height: number
  width: number
  top: number
  left: number
}
