import {type Path} from '@sanity/types'

/** @internal */
export interface TrackedChange {
  element: HTMLElement | null
  path: Path
  isChanged: boolean
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
  zIndex: number
}

/** @internal */
export interface TrackedArea {
  element: HTMLElement | null
}

/** @internal */
export type ChangeIndicatorTrackerContextValue = TrackedChange | TrackedArea
