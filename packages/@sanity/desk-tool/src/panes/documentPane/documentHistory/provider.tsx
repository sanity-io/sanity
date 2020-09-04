import {useObservable} from '@sanity/react-hooks'
import client from 'part:@sanity/base/client'
import React, {useMemo, useCallback} from 'react'
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
        enableTrace: __DEV__
      }),
    [props.documentId]
  )

  // note: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {historyController} = useObservable(
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
        rev: newRev ? newRev : undefined
      })
    },
    [paneRouter]
  )

  let displayed = props.value

  if (historyController.onOlderRevision()) {
    displayed = historyController.displayed()
  }

  return (
    <DocumentHistoryContext.Provider
      value={{
        displayed,
        timeline,
        historyController,
        setRange,
        close,
        open
      }}
    >
      {props.children}
    </DocumentHistoryContext.Provider>
  )
}
