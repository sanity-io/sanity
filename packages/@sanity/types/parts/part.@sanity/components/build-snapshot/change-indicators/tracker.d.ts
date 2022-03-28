import type {ReactNode} from 'react'
import type {Path} from '_self_'
import type {Reported} from '../components/react-track-elements'
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
    | (({children}: {children: ReactNode}) => JSX.Element)
    | ((props: {children: ReactNode}) => JSX.Element),
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
