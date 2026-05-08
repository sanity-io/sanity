import {type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../studio/constants'
import {formatRelativeLocalePublishDate} from '../util/util'

/**
 * Returns a formatter that renders a release's publish date as a locale-aware
 * relative string ("today at 10:20 AM", "tomorrow at 09:00 AM", etc.) interpreted
 * in the user's selected content-releases timezone.
 *
 * Factory shape: the hook itself is called unconditionally at the top of a
 * component (Rules of Hooks compliant); the returned function may be invoked
 * conditionally inside JSX.
 *
 * @internal
 */
export function useFormatRelativeLocalePublishDate(): (release: ReleaseDocument) => string {
  const {timeZone} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  return useCallback(
    (release: ReleaseDocument) => formatRelativeLocalePublishDate(release, timeZone.name),
    [timeZone.name],
  )
}
