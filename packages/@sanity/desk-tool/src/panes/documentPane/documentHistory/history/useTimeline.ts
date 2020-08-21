import {useObservable} from '@sanity/react-hooks'
import client from 'part:@sanity/base/client'
import {useEffect, useMemo, useState} from 'react'
import {Doc} from '../../types'
import {createObservableController} from './controller'
import {Timeline} from './timeline'

declare const __DEV__: boolean

export function useTimeline(params: {
  documentId: string
  draft: Doc | null
  published: Doc | null
  historyDisplayed: string
  startTime?: string
  value: Doc | null
}) {
  const [timeline] = useState(
    () =>
      new Timeline({
        publishedId: params.documentId,
        draft: params.draft,
        published: params.published,
        enableTrace: __DEV__
      })
  )

  const historyController = useObservable(
    useMemo(
      () =>
        createObservableController({
          timeline,
          documentId: params.documentId,
          client
        }),
      [params.documentId]
    )
  )! // note: this emits sync so can never be null

  const historyDisplayed: 'from' | 'to' = params.historyDisplayed === 'from' ? 'from' : 'to'

  const startTime = useMemo(() => {
    if (params.startTime) {
      return timeline.parseTimeId(params.startTime)
    }

    return null
  }, [params.startTime, historyController.version])

  if (startTime) {
    timeline.setRange(startTime, null)
  }

  let displayed = params.value

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

  return {displayed, timeline, historyController, historyDisplayed, startTime}
}
