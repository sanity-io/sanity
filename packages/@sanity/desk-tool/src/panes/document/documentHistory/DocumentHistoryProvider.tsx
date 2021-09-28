import React, {useCallback, useState} from 'react'
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

declare const __DEV__: boolean

export function DocumentHistoryProvider(props: DocumentHistoryProviderProps) {
  const {children, controller, timeline, value} = props

  const paneRouter = usePaneRouter()

  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')

  const {since, rev} = paneRouter.params as Record<string, string | undefined>
  controller.setRange(since || null, rev || null)

  const close = useCallback(() => {
    paneRouter.setParams({...paneRouter.params, since: undefined})
  }, [paneRouter])

  const open = useCallback(() => {
    paneRouter.setParams({...paneRouter.params, since: '@lastPublished'})
  }, [paneRouter])

  const setRange = useCallback(
    (newSince: string, newRev: string | null) => {
      paneRouter.setParams({
        ...paneRouter.params,
        since: newSince,
        rev: newRev ? newRev : undefined,
      })
    },
    [paneRouter]
  )

  let displayed = value

  if (controller.onOlderRevision()) {
    displayed = controller.displayed() as any
  }

  return (
    <DocumentHistoryContext.Provider
      value={{
        displayed,
        timeline,
        historyController: controller,
        setRange,
        close,
        open,
        timelineMode,
        setTimelineMode,
      }}
    >
      {children}
    </DocumentHistoryContext.Provider>
  )
}
