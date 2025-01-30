import {subcribeToVercelProtectionBypass} from '@sanity/preview-url-secret/toggle-vercel-protection-bypass'
import {useEffect, useReducer, useState} from 'react'
import {useClient} from 'sanity'

import {API_VERSION} from './constants'

type VercelProtectionBypassReadyState = 'loading' | 'ready'

export function useVercelBypassSecret(): [
  vercelProtectionBypassSecret: string | null,
  vercelProtectionBypassReadyState: VercelProtectionBypassReadyState,
] {
  const client = useClient({apiVersion: API_VERSION})
  const [vercelProtectionBypassReadyState, ready] = useReducer(
    () => 'ready' as 'ready' | 'loading',
    'loading',
  )
  const [vercelProtectionBypassSecret, setVercelProtectionBypassSecret] = useState<string | null>(
    null,
  )

  useEffect(() => {
    const unsubscribe = subcribeToVercelProtectionBypass(client, (secret) => {
      setVercelProtectionBypassSecret(secret)
      ready()
    })
    return () => unsubscribe()
  }, [client])

  return [vercelProtectionBypassSecret, vercelProtectionBypassReadyState]
}
