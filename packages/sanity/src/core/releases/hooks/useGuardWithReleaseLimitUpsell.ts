import noop from 'lodash-es/noop.js'
import {useEffect, useState} from 'react'

import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'

export function useGuardWithReleaseLimitUpsell() {
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(true)
  const [releasePromise, setReleasePromise] = useState<Promise<boolean> | null>(null)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
    setIsPendingGuardResponse(true)

    const promise = new Promise<boolean>((resolve) => {
      void guardWithReleaseLimitUpsell(noop, false, (hasPassed: boolean) => {
        resolve(hasPassed)
      })
    })

    setReleasePromise(promise)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [guardWithReleaseLimitUpsell, isPendingGuardResponse])

  return {
    releasePromise,
  }
}
