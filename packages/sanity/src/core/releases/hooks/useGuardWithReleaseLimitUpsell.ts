import {useEffect, useState} from 'react'

import {useReleasesUpsell} from '../contexts/upsell/useReleasesUpsell'

export function useGuardWithReleaseLimitUpsell() {
  const [isPendingGuardResponse, setIsPendingGuardResponse] = useState<boolean>(true)
  const [disableQuota, setDisableQuota] = useState<boolean>(true)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  useEffect(() => {
    setIsPendingGuardResponse(true)
    guardWithReleaseLimitUpsell(() => {
      setDisableQuota(false)
      setIsPendingGuardResponse(false)
    })

    return () => {
      setIsPendingGuardResponse(false)
      setDisableQuota(true)
    }
  }, [guardWithReleaseLimitUpsell])

  return {
    isPendingGuardResponse,
    disableQuota,
  }
}
