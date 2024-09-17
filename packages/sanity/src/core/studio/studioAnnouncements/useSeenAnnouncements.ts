import {useCallback, useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {useRouter} from 'sanity/router'

import {useKeyValueStore} from '../../store/_legacy/datastores'

const KEY = 'studio.announcement.seen'
const RESET_PARAM = 'reset-announcements'

export function useSeenAnnouncements(): [string[] | null | 'loading', (seen: string[]) => void] {
  const router = useRouter()
  // Handles the communication with the key value store
  const keyValueStore = useKeyValueStore()
  const seenAnnouncements$ = useMemo(
    () => keyValueStore.getKey(KEY) as Observable<string[] | null>,
    [keyValueStore],
  )
  const seenAnnouncements = useObservable(seenAnnouncements$, 'loading')

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
