import {useObservable} from '@sanity/react-hooks'
import client from 'part:@sanity/base/client'
import React, {useEffect, useMemo, useCallback} from 'react'
import {usePaneRouter} from '../../../contexts/PaneRouterContext'
import {Doc} from '../types'
import {DocumentHistoryContext} from './context'
import {createObservableController} from './history/controller'
import {Timeline} from './history/timeline'

interface DocumentHistoryProviderProps {
  children: React.ReactNode
  draft: Doc | null
  documentId: string
  published: Doc | null
  value: Doc | null
}

declare const __DEV__: boolean

export function DocumentHistoryProvider(props: DocumentHistoryProviderProps) {
  const paneRouter = usePaneRouter()

  const timeline = useMemo(
    () =>
      new Timeline({
        publishedId: props.documentId,
        draft: props.draft,
        published: props.published,
        enableTrace: __DEV__
      }),
    []
  )

  const historyController = useObservable(
    createObservableController({
      timeline,
      documentId: props.documentId,
      client
    })
  )! // note: this emits sync so can never be null

  const historyDisplayed: 'from' | 'to' =
    paneRouter.params.historyDisplayed === 'from' ? 'from' : 'to'

  const startTime = useMemo(() => {
    if (paneRouter.params.startTime) {
      return timeline.parseTimeId(paneRouter.params.startTime)
    }

    return null
  }, [paneRouter.params.startTime, historyController.version])

  if (startTime) {
    timeline.setRange(startTime, null)
  }

  let displayed = props.value

  if (startTime) {
    // timeline.setRange(startTime, null)
    displayed = historyDisplayed === 'from' ? timeline.startAttributes() : timeline.endAttributes()
  }

  // TODO: Fetch only when open
  useEffect(() => {
    historyController.update({
      fetchAtLeast: 5
    })
  })

  const toggleHistory = useCallback(
    (newStartTime: string | null = startTime ? null : '-') => {
      const {startTime: oldStartTime, ...params} = paneRouter.params
      if (newStartTime) {
        paneRouter.setParams({startTime: newStartTime, ...params})
      } else {
        paneRouter.setParams(params)
      }
    },
    [paneRouter]
  )

  const closeHistory = useCallback(() => {
    const {startTime: oldStartTime, ...params} = paneRouter.params
    paneRouter.setParams(params)
  }, [paneRouter])

  return (
    <DocumentHistoryContext.Provider
      value={{
        closeHistory,
        displayed,
        timeline,
        historyController,
        historyDisplayed,
        startTime,
        toggleHistory
      }}
    >
      {props.children}
    </DocumentHistoryContext.Provider>
  )
}
