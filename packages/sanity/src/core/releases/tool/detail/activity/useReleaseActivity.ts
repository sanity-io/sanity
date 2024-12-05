import {useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, type ReleaseDocument, useClient} from 'sanity'

import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseActivityEvents, RELEASE_ACTIVITY_INITIAL_VALUE} from './getReleaseActivityEvents'
import {type ReleaseEvent} from './types'

export interface ReleaseActivity {
  events: ReleaseEvent[]
  loading: boolean
  error: null | Error
  loadMore: () => void
}

export function useReleaseActivity({
  release,
  releaseDocumentsCount,
  releaseDocumentsLoading,
}: {
  release?: ReleaseDocument
  releaseDocumentsCount: number
  releaseDocumentsLoading: boolean
}): ReleaseActivity {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentsCount = useRef<null | number>(null)
  const releaseRev = useRef<string | null>(release?._rev || null)
  const {events$, reloadEvents, loadMore} = useMemo(
    () =>
      getReleaseActivityEvents({
        client,
        releaseId: release?._id ? getReleaseIdFromReleaseDocumentId(release._id) : undefined,
      }),
    [client, release?._id],
  )
  useEffect(() => {
    // Wait until the documents are loaded
    if (releaseDocumentsLoading) return

    // After loading, set the initial value, we only care about changes.
    if (documentsCount.current === null) {
      documentsCount.current = releaseDocumentsCount
      return
    }

    if (releaseDocumentsCount !== documentsCount.current) {
      // eslint-disable-next-line no-console
      console.log('Reloading release events, ::documents:: count changed')
      reloadEvents()
      documentsCount.current = releaseDocumentsCount
    }
  }, [releaseDocumentsCount, releaseDocumentsLoading, reloadEvents])

  useEffect(() => {
    // Wait until the release exists
    if (!release?._rev) return
    // After loading, set the initial value, we only care about changes to the rev
    if (releaseRev.current === null) {
      releaseRev.current = release._rev
      return
    }

    if (releaseRev.current !== release._rev) {
      // eslint-disable-next-line no-console
      console.log('Reloading release events, ::release:: changed')
      reloadEvents()
      releaseRev.current = release._rev
    }
  }, [release?._rev, reloadEvents])

  const {events, loading, error} = useObservable(events$, RELEASE_ACTIVITY_INITIAL_VALUE)

  return {events, loadMore, loading, error}
}
