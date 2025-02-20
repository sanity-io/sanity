import {useObservable} from 'react-rx'

import {useReleaseLimits} from '../store/useReleaseLimits'

/**
 * @internal
 * @returns `boolean` Whether the current org is on a Releases+ plan
 */
export const useIsReleasesPlus = (): boolean => {
  const {releaseLimits$} = useReleaseLimits()

  const releaseLimit = useObservable(releaseLimits$, null)

  const {orgActiveReleaseLimit, defaultOrgActiveReleaseLimit = 0} = releaseLimit || {}

  // presume not releases+ if null releaseLimit
  // (because of internal server error or network error)
  return !!orgActiveReleaseLimit && orgActiveReleaseLimit >= defaultOrgActiveReleaseLimit
}
