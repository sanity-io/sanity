import {useObservable} from 'react-rx'

import {useReleaseLimits} from '../store/useReleaseLimits'

const RELEASES_PLUS_LIMIT = 2

/**
 * @internal
 * @returns `boolean` Whether the current org is on a Releases+ plan
 */
export const useIsReleasesPlus = () => {
  const {releaseLimits$} = useReleaseLimits()

  const releaseLimit = useObservable(releaseLimits$, null)

  const {orgActiveReleaseLimit} = releaseLimit || {}

  // presume not releases+ if null releaseLimit
  return orgActiveReleaseLimit && orgActiveReleaseLimit >= RELEASES_PLUS_LIMIT
}
