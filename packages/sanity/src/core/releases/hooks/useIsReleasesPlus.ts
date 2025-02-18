import {useObservable} from 'react-rx'

import {useReleaseLimits} from '../store/useReleaseLimits'

const RELEASES_PLUS_LIMIT = 2

export const useIsReleasesPlus = () => {
  const {releaseLimits$} = useReleaseLimits()

  const releaseLimit = useObservable(releaseLimits$, null)

  const {orgActiveReleaseLimit} = releaseLimit || {}

  // presume not releases+ if empty data
  return orgActiveReleaseLimit && orgActiveReleaseLimit >= RELEASES_PLUS_LIMIT
}
