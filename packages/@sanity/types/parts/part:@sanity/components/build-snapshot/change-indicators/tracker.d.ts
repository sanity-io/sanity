/// <reference types="react" />
import {Path} from '@sanity/types'
import {Reported} from '../components/react-track-elements'
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
declare const Tracker:
    | (({children}: {children: import('react').ReactNode}) => JSX.Element)
    | ((props: {children: import('react').ReactNode}) => JSX.Element),
  useReportedValues:
    | (() => Reported<TrackedChange | TrackedArea>[])
    | (() => Reported<TrackedChange | TrackedArea>[]),
  useReporter:
    | import('../components/react-track-elements/createUseReporter').ReporterHook<
        TrackedChange | TrackedArea
      >
    | ((
        id: string,
        value: TrackedChange | TrackedArea | (() => TrackedChange | TrackedArea),
        isEqual: import('../components/react-track-elements/createUseReporter').IsEqualFunction<
          TrackedChange | TrackedArea
        >
      ) => void)
export {Tracker, useReportedValues, useReporter, Reported}
