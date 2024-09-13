import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {useKeyValueStore} from 'sanity'

const KEY = 'studio.announcement.seen'

/**
 * TODO: This is not functional yet, the API is not accepting the new key
 */
export function useSeenAnnouncements(): [string[] | null | 'loading', (seen: string[]) => void] {
  // Handles the communication with the key value store
  const keyValueStore = useKeyValueStore()
  const seenAnnouncements$ = useMemo(
    () => keyValueStore.getKey(KEY) as Observable<string[] | null>,
    [keyValueStore],
  )
  const seenAnnouncements = useObservable(seenAnnouncements$, 'loading')

  const setSeenAnnouncements = useCallback((seen: string[]) => {
    // eslint-disable-next-line no-console
    console.log('Seen announcements', seen)
    // keyValueStore.setKey(KEY, seen)
  }, [])

  return [seenAnnouncements, setSeenAnnouncements]
}
