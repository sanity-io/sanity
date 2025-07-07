import {useEffect, useState} from 'react'

import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'

export function useGuardWithReleaseLimitUpsell() {
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(true)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  useEffect(() => {
    setIsPendingGuardResponse(true)
    guardWithReleaseLimitUpsell(() => {
      setIsPendingGuardResponse(false)
    })

    return () => {
      if (!isPendingGuardResponse) setIsPendingGuardResponse(true)
    }
  }, [guardWithReleaseLimitUpsell, isPendingGuardResponse])

  return {
    isPendingGuardResponse,
  }
}
