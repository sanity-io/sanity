import {Path} from '@sanity/types'
import {createScope} from '../react-track-elements'
import {ENABLED} from './constants'
import {createNoopTracker} from './noop-tracker'

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
  ? createScope<TrackedChange | TrackedArea>()
  : createNoopTracker<TrackedChange | TrackedArea>()

export {Tracker, useReportedValues, useReporter}
