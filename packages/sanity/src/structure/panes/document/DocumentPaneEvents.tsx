import {useEffect, useMemo, useRef} from 'react'
import {
  EventsProvider,
  getDraftId,
  getPublishedId,
  getVersionId,
  resolveBundlePerspective,
  useEventsStore,
  usePerspective,
  useReleases,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {usePaneRouter} from '../../components'
import {EMPTY_PARAMS} from './constants'
import {usePaneOptions} from './DocumentPane'
import {DocumentPaneProviderInner} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'

export const DocumentPaneEvents = (props: DocumentPaneProviderProps) => {
  const {params = EMPTY_PARAMS, setParams} = usePaneRouter()
  const options = usePaneOptions(props.pane.options, params)

  const {perspective} = usePerspective()
  const bundlePerspective = resolveBundlePerspective(perspective)
  const {archivedReleases} = useReleases()
  const {rev, since, historyVersion} = params

  const documentId = useMemo(() => {
    if (historyVersion && archivedReleases.some((release) => release.name === historyVersion)) {
      // Check if we have a release that matches with this historyVersion
      return getVersionId(options.id, historyVersion)
    }
    if (typeof perspective === 'undefined') {
      return getDraftId(options.id)
    }
    if (perspective === 'published') {
      return getPublishedId(options.id)
    }
    if (bundlePerspective) {
      return getVersionId(options.id, bundlePerspective)
    }
    return options.id
  }, [archivedReleases, historyVersion, bundlePerspective, perspective, options.id])

  const isMounted = useRef(false)

  const updateHistoryParams = useEffectEvent((_perspective?: string) => {
    setParams({
      ...params,
      // Reset the history related params when the perspective changes, as they don't make sense
      // in the context of the new perspective - preserveRev is used when setting draft revision.
      rev: params.preserveRev === 'true' ? params.rev : undefined,
      preserveRev: undefined,
      since: undefined,
      historyVersion: undefined,
    })
  })
  useEffect(() => {
    // Skip the first run to avoid resetting the params on initial load
    if (isMounted.current) {
      updateHistoryParams(perspective)
    } else {
      isMounted.current = true
    }
    // TODO: Remove `updateHistoryParams` as a dependency when react eslint plugin is updated
  }, [perspective, updateHistoryParams])

  const eventsStore = useEventsStore({documentId, documentType: options.type, rev, since})

  const historyStoreProps = useMemo(
    () => ({
      error: eventsStore.error,
      revisionId: eventsStore.revision?.revisionId || null,
      onOlderRevision: Boolean(eventsStore.revision?.document && eventsStore.revision?.revisionId),
      revisionDocument: eventsStore.revision?.document || null,
      sinceDocument: eventsStore.sinceRevision?.document || null,
      ready: !eventsStore.loading,
      isPristine: Boolean(eventsStore.events.length === 0),
      lastNonDeletedRevId:
        eventsStore.events.find(
          (e) => e.type !== 'DeleteDocumentGroup' && e.type !== 'DeleteDocumentVersion',
        )?.id || null,
    }),
    [eventsStore],
  )

  const value = useMemo(() => eventsStore, [eventsStore])

  return (
    <EventsProvider value={value}>
      <DocumentPaneProviderInner {...props} historyStore={historyStoreProps} />
    </EventsProvider>
  )
}
