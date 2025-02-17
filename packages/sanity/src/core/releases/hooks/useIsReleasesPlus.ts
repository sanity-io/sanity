import {useEffect, useState} from 'react'

import {useReleaseLimits} from '../store/useReleaseLimits'

const RELEASES_PLUS_LIMIT = 2

export const useIsReleasesPlus = () => {
  const {fetchReleaseLimits} = useReleaseLimits()

  const [isReleasesPlus, setIsReleasesPlus] = useState<boolean | undefined>(undefined)
  const [hasFetchedLimits, setHasFetchedLimits] = useState(false)

  useEffect(() => {
    if (isReleasesPlus !== undefined || hasFetchedLimits) return

    setHasFetchedLimits(true)
    fetchReleaseLimits()
      .then((limits) =>
        setIsReleasesPlus((limits.orgActiveReleaseLimit || 0) > RELEASES_PLUS_LIMIT),
      )
      .catch(() => setIsReleasesPlus(false))
  }, [fetchReleaseLimits, hasFetchedLimits, isReleasesPlus])

  return isReleasesPlus
}
