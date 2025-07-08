import {useEffect, useState} from 'react'

import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'

export function useGuardWithReleaseLimitUpsell() {
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(true)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  useEffect(() => {
    let useEffectCleanup = false
    setIsPendingGuardResponse(true)
    guardWithReleaseLimitUpsell(() => {
      if (!useEffectCleanup) {
        setIsPendingGuardResponse(false)
      }
    })

    return () => {
      useEffectCleanup = true
    }
  }, [guardWithReleaseLimitUpsell, isPendingGuardResponse])

  return {
    isPendingGuardResponse,
  }
}
