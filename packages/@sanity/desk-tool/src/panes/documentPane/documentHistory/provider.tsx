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

const START_TIME_PARAM_KEY = 'version'

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

  // note: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const historyController = useObservable(
    useMemo(
      () =>
        createObservableController({
          timeline,
          documentId: props.documentId,
          client
        }),
      [props.documentId]
    )
  )!

  const historyDisplayed: 'from' | 'to' =
    paneRouter.params.historyDisplayed === 'from' ? 'from' : 'to'

  const startTime = useMemo(() => {
    if (paneRouter.params[START_TIME_PARAM_KEY]) {
      return timeline.parseTimeId(paneRouter.params[START_TIME_PARAM_KEY])
    }

    return null
  }, [paneRouter.params[START_TIME_PARAM_KEY], historyController.version])

  if (startTime) {
    timeline.setRange(startTime, null)
  }

  let displayed = props.value

  if (startTime && historyDisplayed == 'from') {
    displayed = timeline.startAttributes()
  }

  // TODO: Fetch only when open
  useEffect(() => {
    historyController.update({
      fetchAtLeast: 5
    })
  })

  const toggleHistory = useCallback(
    (newStartTime: string | null = startTime ? null : '-') => {
      const {[START_TIME_PARAM_KEY]: _, ...params} = paneRouter.params
      if (newStartTime) {
        paneRouter.setParams({[START_TIME_PARAM_KEY]: newStartTime, ...params})
      } else {
        paneRouter.setParams(params)
      }
    },
    [paneRouter]
  )

  const closeHistory = useCallback(() => {
    const {[START_TIME_PARAM_KEY]: _, ...params} = paneRouter.params
    paneRouter.setParams(params)
  }, [paneRouter])

  const toggleHistoryDisplayed = useCallback((value: 'from' | 'to') => {
    paneRouter.setParams({...paneRouter.params, historyDisplayed: value})
  }, [])

  return (
    <DocumentHistoryContext.Provider
      value={{
        closeHistory,
        displayed,
        timeline,
        historyController,
        historyDisplayed,
        startTime,
        toggleHistory,
        toggleHistoryDisplayed
      }}
    >
      {props.children}
    </DocumentHistoryContext.Provider>
  )
}
