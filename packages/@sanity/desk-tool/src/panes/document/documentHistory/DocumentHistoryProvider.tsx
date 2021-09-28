import React, {useCallback, useEffect, useState} from 'react'
import {SanityDocument} from '@sanity/types'
import {usePaneRouter} from '../../../contexts/paneRouter'
import {DocumentHistoryContext} from './DocumentHistoryContext'
import {Controller} from './history/Controller'
import {Timeline} from './history/Timeline'

interface DocumentHistoryProviderProps {
  children: React.ReactNode
  controller: Controller
  timeline: Timeline
  value: Partial<SanityDocument> | null
}

export function DocumentHistoryProvider(props: DocumentHistoryProviderProps) {
  const {children, controller, timeline, value} = props
  const paneRouter = usePaneRouter()
  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')
  const {since, rev} = paneRouter.params as Record<string, string | undefined>

  useEffect(() => {
    controller.setRange(since || null, rev || null)
  }, [controller, rev, since])

  const setRange = useCallback(
    (newSince: string, newRev: string | null) => {
      paneRouter.setParams({
        ...paneRouter.params,
        since: newSince,
        rev: newRev || undefined,
      })
    },
    [paneRouter]
  )

  let displayed = value

  if (controller.onOlderRevision()) {
    displayed = controller.displayed() as Partial<SanityDocument>
  }

  return (
    <DocumentHistoryContext.Provider
      value={{
        displayed,
        timeline,
        historyController: controller,
        setRange,
        timelineMode,
        setTimelineMode,
      }}
    >
      {children}
    </DocumentHistoryContext.Provider>
  )
}
