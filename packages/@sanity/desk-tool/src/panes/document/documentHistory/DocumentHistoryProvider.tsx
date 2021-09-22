import React, {useCallback, useMemo, useState} from 'react'
import {useMemoObservable} from 'react-rx'
import {SanityDocument} from '@sanity/types'
import {versionedClient} from '../../../versionedClient'
import {usePaneRouter} from '../../../contexts/paneRouter'
import {DocumentHistoryContext} from './DocumentHistoryContext'
import {createObservableController} from './history/Controller'
import {Timeline} from './history/Timeline'

interface DocumentHistoryProviderProps {
  children: React.ReactNode
  documentId: string
  value: Partial<SanityDocument> | null
}

declare const __DEV__: boolean

export function DocumentHistoryProvider(props: DocumentHistoryProviderProps) {
  const {children, documentId, value} = props

  const paneRouter = usePaneRouter()

  const [timelineMode, setTimelineMode] = useState<'since' | 'rev' | 'closed'>('closed')

  const timeline = useMemo(() => new Timeline({publishedId: documentId, enableTrace: __DEV__}), [
    documentId,
  ])

  // note: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useMemoObservable(
    () =>
      createObservableController({
        timeline,
        documentId,
        client: versionedClient,
      }),
    [documentId, timeline]
  )!

  const {since, rev} = paneRouter.params as Record<string, string | undefined>
  historyController.setRange(since || null, rev || null)

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

  if (historyController.onOlderRevision()) {
    displayed = historyController.displayed() as any
  }

  return (
    <DocumentHistoryContext.Provider
      value={{
        displayed,
        timeline,
        historyController,
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
