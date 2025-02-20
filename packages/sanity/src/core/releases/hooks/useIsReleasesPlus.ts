import {useObservable} from 'react-rx'

import {useClient} from '../../hooks/useClient'
import {useReleaseLimits} from '../store/useReleaseLimits'

/**
 * @internal
 * @returns `boolean` Whether the current org is on a Releases+ plan
 */
export const useIsReleasesPlus = (): boolean => {
  const client = useClient().observable
  const {releaseLimits$} = useReleaseLimits(client)

  const releaseLimit = useObservable(releaseLimits$, null)

  const {orgActiveReleaseLimit, defaultOrgActiveReleaseLimit = 0} = releaseLimit || {}

  // presume not releases+ if null releaseLimit
  // (because of internal server error or network error)
  return !!orgActiveReleaseLimit && orgActiveReleaseLimit >= defaultOrgActiveReleaseLimit
}
