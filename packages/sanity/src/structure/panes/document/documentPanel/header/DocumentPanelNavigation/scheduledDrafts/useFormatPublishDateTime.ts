import {type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE, useDateTimeFormat, useTimeZone} from 'sanity'

/** When a release goes out, or `undefined` when it has no date yet. */
export function getPublishDate(release: ReleaseDocument): string | undefined {
  return release.publishAt ?? release.metadata.intendedPublishAt
}

/**
 * Returns a function that formats a release's publish date as an absolute date and time
 * (e.g. "Oct 31, 2026, 10:00 AM") in the studio's selected content-releases timezone, or returns
 * `undefined` for a release with no publish date. Unlike `useFormatRelativeLocalePublishDate`, it
 * keeps the time for dates more than a week away.
 *
 * @internal
 */
export function useFormatPublishDateTime(): (release: ReleaseDocument) => string | undefined {
  const {timeZone} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timeZone.name,
  })

  return useCallback(
    (release: ReleaseDocument) => {
      const publishDate = getPublishDate(release)
      return publishDate ? dateTimeFormat.format(new Date(publishDate)) : undefined
    },
    [dateTimeFormat],
  )
}
