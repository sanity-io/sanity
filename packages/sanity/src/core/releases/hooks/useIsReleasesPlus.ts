import {useEffect, useState} from 'react'

import {useReleaseLimits} from '../store/useReleaseLimits'

const RELEASES_PLUS_LIMIT = 2

export const useIsReleasesPlus = () => {
  const {fetchReleaseLimits, isFetching, isError} = useReleaseLimits()

  const [isReleasesPlus, setIsReleasesPlus] = useState<boolean | null>(null)

  useEffect(() => {
    if (isReleasesPlus !== null || isFetching) return

    fetchReleaseLimits().then((limits) => {
      if (limits?.orgActiveReleaseLimit) {
        const {orgActiveReleaseLimit} = limits

        setIsReleasesPlus(orgActiveReleaseLimit > RELEASES_PLUS_LIMIT)
      }
    })
  }, [fetchReleaseLimits, isFetching, isReleasesPlus])

  useEffect(() => {
    if (isError) setIsReleasesPlus(false)
  }, [isError])

  return isReleasesPlus
}
