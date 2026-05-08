import {type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../studio/constants'
import {formatRelativeLocalePublishDate} from '../util/util'

/**
 * Returns a function that formats a release's publish date in the studio's
 * selected content-releases timezone (e.g. "today at 10:20 AM"). The returned
 * function is safe to call inside conditional JSX.
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
