/* eslint-disable camelcase */
import {type SanityDocument} from '@sanity/types'
import {useMemo, useState} from 'react'
import {getPublishedId, usePerspective, useTimelineSelector, useTimelineStore} from 'sanity'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentPaneWithLegacyTimelineStore = (props: DocumentPaneProviderProps) => {
  const {pane} = props
  const paneRouter = usePaneRouter()
  const {selectedReleaseId} = usePerspective()
  const options = usePaneOptions(pane.options, paneRouter.params)

  const params = paneRouter.params || EMPTY_PARAMS

  const [timelineError, setTimelineError] = useState<Error | null>(null)

  const timelineStore = useTimelineStore({
    documentId: getPublishedId(options.id),
    documentType: options.type,
    onError: setTimelineError,
    rev: params.rev,
    since: params.since,
    version: selectedReleaseId,
  })

  const revTime = useTimelineSelector(timelineStore, (state) => state.revTime)
  // TODO: Maybe derive this from the `revTime` selector, ifRevTime === onOlderRevision:true?
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const timelineDisplayed = useTimelineSelector(timelineStore, (state) => state.timelineDisplayed)
  const sinceAttributes = useTimelineSelector(timelineStore, (state) => state.sinceAttributes)
  const timelineReady = useTimelineSelector(timelineStore, (state) => state.timelineReady)
  const isPristine = useTimelineSelector(timelineStore, (state) => state.isPristine)
  const lastNonDeletedRevId = useTimelineSelector(
    timelineStore,
    (state) => state.lastNonDeletedRevId,
  )
  const historyStoreProps = useMemo(
    () => ({
      store: timelineStore,
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
      timelineStore,
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
