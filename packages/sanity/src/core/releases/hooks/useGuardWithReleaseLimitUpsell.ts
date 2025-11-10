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
      void guardWithReleaseLimitUpsell(noop, false, (hasPassed: boolean) => {
        resolve(hasPassed)
      })
    })

    setReleasePromise(promise)
  }, [guardWithReleaseLimitUpsell, isPendingGuardResponse])

  return {
    releasePromise,
  }
}
