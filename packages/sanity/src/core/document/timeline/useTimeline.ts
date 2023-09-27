import {useContext} from 'react'
import {DocumentContextError} from '../DocumentContextError'
import {TimelineContext, TimelineContextValue} from './TimelineContext'

/** @internal */
export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext)
  if (!context) throw new DocumentContextError()

  return context
}
