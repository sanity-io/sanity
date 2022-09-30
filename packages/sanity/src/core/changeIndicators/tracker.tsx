import {Path} from '@sanity/types'
import {createNoopTrackerScope, createTrackerScope} from '../components/react-track-elements'
import {ENABLED} from './constants'

/** @internal */
export interface TrackedChange {
  element: HTMLElement
  path: Path
  isChanged: boolean
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
  zIndex: number
}

/** @internal */
export interface TrackedArea {
  element: HTMLElement
}

const trackerScope = ENABLED
  ? createTrackerScope<TrackedChange | TrackedArea>()
  : createNoopTrackerScope<TrackedChange | TrackedArea>()

/** @internal */
export const Tracker = trackerScope.Tracker

/** @internal */
export const useReportedValues = trackerScope.useReportedValues

/** @internal */
export const useReporter = trackerScope.useReporter
