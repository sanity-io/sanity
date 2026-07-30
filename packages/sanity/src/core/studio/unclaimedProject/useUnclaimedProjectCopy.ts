import {useEffect, useState} from 'react'
import {catchError, defer, map, of, tap} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'

const UNCLAIMED_PROJECT_COPY_API_VERSION = '2026-07-28'
const UNCLAIMED_PROJECT_COPY_URI = '/journey/unclaimed-project'
const LOCAL_COPY_URL = import.meta.env?.SANITY_STUDIO_UNCLAIMED_PROJECT_COPY_URL

/** Copy owned and served by Journey so it can change independently of Studio releases. */
export interface UnclaimedProjectCopy {
  criticalThresholdHours: number
  snoozeMinutes: number
  banner: {
    text: string
    criticalText: string
    claimButtonText: string
  }
  toast: {
    title: string
    criticalTitle: string
    description: string
    claimButtonText: string
    snoozeButtonText: string
  }
  claimed: {
    text: string
    signInButtonText: string
  }
  expired: {
    toastTitle: string
  }
  noClaimUrl: {
    text: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function hasStringProperties(value: unknown, keys: string[]): value is Record<string, string> {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'string')
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/** @internal */
export function parseUnclaimedProjectCopy(value: unknown): UnclaimedProjectCopy | undefined {
  if (!isRecord(value)) return undefined

  if (
    !isPositiveInteger(value.criticalThresholdHours) ||
    !isPositiveInteger(value.snoozeMinutes) ||
    !hasStringProperties(value.banner, ['text', 'criticalText', 'claimButtonText']) ||
    !hasStringProperties(value.toast, [
      'title',
      'criticalTitle',
      'description',
      'claimButtonText',
      'snoozeButtonText',
    ]) ||
    !hasStringProperties(value.claimed, ['text', 'signInButtonText']) ||
    !hasStringProperties(value.expired, ['toastTitle']) ||
    !hasStringProperties(value.noClaimUrl, ['text'])
  ) {
    return undefined
  }

  return {
    criticalThresholdHours: value.criticalThresholdHours,
    snoozeMinutes: value.snoozeMinutes,
    banner: {
      text: value.banner.text,
      criticalText: value.banner.criticalText,
      claimButtonText: value.banner.claimButtonText,
    },
    toast: {
      title: value.toast.title,
      criticalTitle: value.toast.criticalTitle,
      description: value.toast.description,
      claimButtonText: value.toast.claimButtonText,
      snoozeButtonText: value.toast.snoozeButtonText,
    },
    claimed: {
      text: value.claimed.text,
      signInButtonText: value.claimed.signInButtonText,
    },
    expired: {
      toastTitle: value.expired.toastTitle,
    },
    noClaimUrl: {
      text: value.noClaimUrl.text,
    },
  }
}

/** @internal */
export function getLocalUnclaimedProjectCopyUrl({
  isDev,
  value,
}: {
  isDev: boolean
  value: string | undefined
}): string | undefined {
  if (!isDev || !value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

/** Fetch Journey-owned copy only after the project is known to be part of mint-and-claim. */
export function useUnclaimedProjectCopy(enabled: boolean): UnclaimedProjectCopy | undefined {
  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    apiVersion: UNCLAIMED_PROJECT_COPY_API_VERSION,
  })
  const localCopyUrl = getLocalUnclaimedProjectCopyUrl({
    isDev: import.meta.env?.DEV ?? false,
    value: LOCAL_COPY_URL,
  })
  const [copyState, setCopyState] = useState<{
    client: typeof client
    copy: UnclaimedProjectCopy | undefined
  }>()

  useEffect(() => {
    if (!enabled) return undefined

    const copy$ = localCopyUrl
      ? defer(async () => {
          const response = await fetch(localCopyUrl, {credentials: 'omit'})
          if (!response.ok) throw new Error(`Journey copy request failed: ${response.status}`)
          return response.json()
        })
      : client.observable.request<unknown>({uri: UNCLAIMED_PROJECT_COPY_URI})

    const subscription = copy$
      .pipe(
        map(parseUnclaimedProjectCopy),
        catchError(() => of(undefined)),
        tap((copy) => setCopyState({client, copy})),
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [client, enabled, localCopyUrl])

  return enabled && copyState?.client === client ? copyState.copy : undefined
}
