import {useEffect} from 'react'
import {useRouter} from 'sanity/router'

import {useStudioPreference} from '../../store/preferences/useStudioPreference'

const RESET_PARAM = 'reset-announcements'

/**
 * The IDs of the announcements the user has seen, or `undefined` until they're known.
 */
export function useSeenAnnouncements(): [string[] | undefined, (seen: string[]) => void] {
  const router = useRouter()
  const {value, status, set} = useStudioPreference('studio.announcement.seen')
  const resetAnnouncementsParams = new URLSearchParams(router.state._searchParams).get(RESET_PARAM)

  useEffect(() => {
    // For testing purposes, reset the seen params.
    // e.g. /structure?reset-announcements=foo,bar
    // Will reset the values of the seen announcement to: ['foo', 'bar']
    if (resetAnnouncementsParams !== null) {
      void set(resetAnnouncementsParams ? resetAnnouncementsParams.split(',') : [])
    }
  }, [resetAnnouncementsParams, set])

  return [status === 'success' ? (value ?? []) : undefined, set]
}
