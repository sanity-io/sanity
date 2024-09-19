import {useCallback, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useRouter} from 'sanity/router'

import {useKeyValueStore} from '../../store/_legacy/datastores'

const KEY = 'studio.announcement.seen'
const RESET_PARAM = 'reset-announcements'

interface SeenAnnouncementsState {
  value: string[] | null
  error: Error | null
  loading: boolean
}
const INITIAL_STATE: SeenAnnouncementsState = {
  value: null,
  error: null,
  loading: true,
}

export function useSeenAnnouncements(): [SeenAnnouncementsState, (seen: string[]) => void] {
  const router = useRouter()
  const keyValueStore = useKeyValueStore()
  const seenAnnouncements$ = useMemo(
    () =>
      keyValueStore.getKey(KEY).pipe(
        map((value) => ({value: value as string[] | null, error: null, loading: false})),
        catchError((error) => of({value: null, error: error, loading: false})),
      ),
    [keyValueStore],
  )

  const seenAnnouncements = useObservable(seenAnnouncements$, INITIAL_STATE)

  const setSeenAnnouncements = useCallback(
    (seen: string[]) => {
      keyValueStore.setKey(KEY, seen)
    },
    [keyValueStore],
  )
  const params = new URLSearchParams(router.state._searchParams)
  const resetAnnouncementsParams = params?.get(RESET_PARAM)

  useEffect(() => {
    // For testing purposes, reset the seen params.
    // e.g. /structure?reset-announcements=foo,bar
    // Will reset the values of the seen announcement to: ['foo', 'bar']
    if (resetAnnouncementsParams !== null) {
      const resetValue = resetAnnouncementsParams ? resetAnnouncementsParams.split(',') : []
      setSeenAnnouncements(resetValue)
    }
  }, [resetAnnouncementsParams, setSeenAnnouncements])

  return [seenAnnouncements, setSeenAnnouncements]
}
