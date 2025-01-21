import {type SanityDocument} from '@sanity/types'
import {useMemo, useState} from 'react'
import {getPublishedId, useTimelineSelector, useTimelineStore} from 'sanity'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentPaneWithLegacyTimelineStore = (props: DocumentPaneProviderProps) => {
  const {pane} = props
  const paneRouter = usePaneRouter()
  const options = usePaneOptions(pane.options, paneRouter.params)

  const params = paneRouter.params || EMPTY_PARAMS

  const [timelineError, setTimelineError] = useState<Error | null>(null)

  const store = useTimelineStore({
    documentId: getPublishedId(options.id),
    documentType: options.type,
    onError: setTimelineError,
    rev: params.rev,
    since: params.since,
  })

  const onOlderRevision = useTimelineSelector(store, (state) => state.onOlderRevision)
  const revTime = useTimelineSelector(store, (state) => state.revTime)
  const sinceAttributes = useTimelineSelector(store, (state) => state.sinceAttributes)
  const timelineDisplayed = useTimelineSelector(store, (state) => state.timelineDisplayed)
  const timelineReady = useTimelineSelector(store, (state) => state.timelineReady)
  const isPristine = useTimelineSelector(store, (state) => state.isPristine)
  const lastNonDeletedRevId = useTimelineSelector(store, (state) => state.lastNonDeletedRevId)

  const historyStoreProps = useMemo(
    () => ({
      store,
      error: timelineError,
      revisionId: revTime?.id || null,
      onOlderRevision: onOlderRevision,
      revisionDocument: timelineDisplayed as SanityDocument | null,
      sinceDocument: sinceAttributes as SanityDocument | null,
      ready: timelineReady,
      isPristine: Boolean(isPristine),
      lastNonDeletedRevId,
    }),
    [
      store,
      timelineError,
      revTime?.id,
      onOlderRevision,
      timelineDisplayed,
      sinceAttributes,
      timelineReady,
      isPristine,
      lastNonDeletedRevId,
    ],
  )
  return <DocumentPaneProvider {...props} historyStore={historyStoreProps} />
}
