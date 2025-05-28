import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useReleaseLimits} from '../store/useReleaseLimits'

/**
 * @internal
 * @returns `boolean` Whether the current org is on a Releases+ plan
 */
export const useIsReleasesPlus = (): boolean => {
  const {releaseLimits$} = useReleaseLimits()
  const {enabled: isReleasesFeatureEnabled} = useFeatureEnabled('contentReleases')

  /**
   * Only provide observable to cache store if releases is feature enabled
   */
  const releasesLimitForPlus$ = useMemo(
    () => (isReleasesFeatureEnabled ? releaseLimits$ : of(null)),
    [isReleasesFeatureEnabled, releaseLimits$],
  )

  const releaseLimit = useObservable(releasesLimitForPlus$, null)

  if (!isReleasesFeatureEnabled) return false

  const {orgActiveReleaseLimit, defaultOrgActiveReleaseLimit = 0} = releaseLimit || {}

  // presume not releases+ if null releaseLimit
  // (because of internal server error or network error)
  return !!orgActiveReleaseLimit && orgActiveReleaseLimit > defaultOrgActiveReleaseLimit
}
