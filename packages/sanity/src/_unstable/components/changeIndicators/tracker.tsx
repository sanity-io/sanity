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

const {Tracker, useReportedValues, useReporter} = ENABLED
  ? createTrackerScope<TrackedChange | TrackedArea>()
  : createNoopTrackerScope<TrackedChange | TrackedArea>()

export {Tracker, useReportedValues, useReporter}
