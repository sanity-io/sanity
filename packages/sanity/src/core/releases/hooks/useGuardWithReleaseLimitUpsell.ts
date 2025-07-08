import {noop} from 'lodash'
import {useEffect, useState} from 'react'

import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'

export function useGuardWithReleaseLimitUpsell() {
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(true)
  const [releasePromise, setReleasePromise] = useState<Promise<boolean> | null>(null)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  useEffect(() => {
    setIsPendingGuardResponse(true)

    const promise = new Promise<boolean>((resolve) => {
      guardWithReleaseLimitUpsell(noop, false, (hasPassed: boolean) => {
        resolve(hasPassed)
      })
    }).then((value) => {
      // we're adding this so that we can actually do the "await" section in this hook
      // instead of having to do it everything that it is called
      return value
    })

    setReleasePromise(promise)
  }, [guardWithReleaseLimitUpsell, isPendingGuardResponse])

  return {
    releasePromise,
  }
}
