import {Path} from '@sanity/types'
import {createNoopTrackerScope, createTrackerScope} from '../react-track-elements'
import {ENABLED} from './constants'

export interface TrackedChange {
  element: HTMLElement
  path: Path
  isChanged: boolean
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
  zIndex: number
}

export interface TrackedArea {
  element: HTMLElement
}

const trackerScope = ENABLED
  ? createTrackerScope<TrackedChange | TrackedArea>()
  : createNoopTrackerScope<TrackedChange | TrackedArea>()

export const Tracker = trackerScope.Tracker

export const useReportedValues = trackerScope.useReportedValues

export const useReporter = trackerScope.useReporter
