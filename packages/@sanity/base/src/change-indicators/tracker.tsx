import {createScope, Reported} from '../components/react-track-elements'
import {Path} from '@sanity/types'

export interface TrackedChange {
  element: HTMLElement
  path: Path
  isChanged: boolean
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
}

export interface TrackedArea {
  element: HTMLElement
}

const {Tracker, useReportedValues, useReporter} = createScope<TrackedChange | TrackedArea>()

export {Tracker, useReportedValues, useReporter, Reported}
