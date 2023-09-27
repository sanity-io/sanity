import React, {useCallback, useState} from 'react'
import {
  TimelineController,
  TimelineState,
  useTimelineStore as useStandaloneTimelineStore,
} from '../../store'
import {useDocumentId} from '../useDocumentId'
import {useDocumentType} from '../useDocumentType'
import {useShallowMemoizedObject} from '../../util'
import {TimelineContext} from './TimelineContext'

/** @internal */
export interface TimelineStore {
  findRangeForRev: TimelineController['findRangeForNewRev']
  findRangeForSince: TimelineController['findRangeForNewSince']
  loadMore: () => void
  getSnapshot: () => TimelineState
  subscribe: (callback: () => void) => () => void
}

/** @internal */
export interface TimelineProviderProps {
  children: React.ReactNode
  timelineRange: {rev?: string; since?: string}
  onTimelineRangeChange: (range: {rev?: string; since?: string}) => void
}

/** @internal */
export function TimelineProvider({
  children,
  timelineRange: {rev, since},
  onTimelineRangeChange: onRangeChange,
}: TimelineProviderProps) {
  const documentId = useDocumentId()
  const documentType = useDocumentType()

  const timelineStore = useStandaloneTimelineStore({
    documentId,
    documentType,
    rev,
    since,
  })

  // this handler exists to replace `null`s with `undefined`s
  const handleSetRange = useCallback(
    (range: {rev?: string | null; since?: string | null}) => {
      onRangeChange({
        rev: range.rev || undefined,
        since: range.since || undefined,
      })
    },
    [onRangeChange],
  )

  return (
    <TimelineContext.Provider
      value={useShallowMemoizedObject({
        timelineStore,
        setRange: handleSetRange,
      })}
    >
      {children}
    </TimelineContext.Provider>
  )
}
