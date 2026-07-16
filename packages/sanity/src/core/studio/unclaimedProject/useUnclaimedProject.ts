import {useEffect, useState} from 'react'

import {isDev} from '../../environment'
import {useClient} from '../../hooks/useClient'
import {useWorkspace} from '../workspace'

/** Sentinel organization that owns every minted-but-unclaimed project. */
const UNCLAIMED_ORGANIZATION_ID = 'oSystemUnclaimed'

/** Unclaimed projects are destroyed 72 hours after creation. */
const UNCLAIMED_PROJECT_TTL_MS = 72 * 60 * 60 * 1000

/** How often the countdown (and any snooze window) re-evaluates. */
const TICK_INTERVAL_MS = 60 * 1000

/** @internal */
export interface UnclaimedProjectState {
  claimUrl: string
  expiresAt: Date
  msLeft: number
}

/**
 * The claim URL is a bearer credential returned only at mint time — no API exposes it
 * afterwards. The hosting environment must hand it to the studio: either a global set by
 * user config / a dev server that reads the CLI's local mint records, or a
 * `SANITY_STUDIO_CLAIM_URL` env var. Without one we fall back to the manage dashboard.
 */
function getClaimUrl(): string {
  const injected = (globalThis as {__SANITY_UNCLAIMED_PROJECT_CLAIM_URL__?: unknown})
    .__SANITY_UNCLAIMED_PROJECT_CLAIM_URL__
  if (typeof injected === 'string' && injected) return injected
  const fromEnv = typeof process === 'undefined' ? undefined : process?.env?.SANITY_STUDIO_CLAIM_URL
  return fromEnv || 'https://www.sanity.io/manage'
}

/**
 * Detects whether the current project is a minted-but-unclaimed project (owned by the
 * unclaimed system organization) and, if so, returns its claim URL and the time left
 * before it expires, ticking every minute. Returns `undefined` for claimed projects,
 * while loading, on request errors, and outside dev mode (local studios only for now).
 *
 * @internal
 */
export function useUnclaimedProject(): UnclaimedProjectState | undefined {
  const {projectId} = useWorkspace()
  const client = useClient({apiVersion: '2026-06-23'})
  const [createdAt, setCreatedAt] = useState<string | undefined>()
  const [unclaimed, setUnclaimed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  // Captured once per mount: the claim URL is handed to the studio by its environment and
  // never changes during a session, and reading it lazily keeps render pure.
  const [claimUrl] = useState(getClaimUrl)

  useEffect(() => {
    if (!isDev) return undefined
    const sub = client.observable
      .request<{createdAt?: string; organizationId?: string}>({
        uri: `/projects/${projectId}`,
        tag: 'unclaimed-project-check',
      })
      .subscribe({
        next: (project) => {
          setUnclaimed(project?.organizationId === UNCLAIMED_ORGANIZATION_ID)
          setCreatedAt(project?.createdAt)
        },
        // An identity without project-metadata access simply never gets nudged.
        error: () => setUnclaimed(false),
      })
    return () => sub.unsubscribe()
  }, [client, projectId])

  useEffect(() => {
    if (!unclaimed) return undefined
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [unclaimed])

  if (!isDev || !unclaimed || !createdAt) return undefined
  const expiresAt = new Date(new Date(createdAt).getTime() + UNCLAIMED_PROJECT_TTL_MS)
  const msLeft = expiresAt.getTime() - now
  return {claimUrl, expiresAt, msLeft: msLeft > 0 ? msLeft : 0}
}

/** @internal */
export function formatTimeLeft(msLeft: number): string {
  const totalMinutes = Math.max(Math.round(msLeft / 60_000), 1)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainderHours = hours % 24
    return remainderHours ? `${days} days ${remainderHours} hours` : `${days} days`
  }
  if (hours >= 1) return minutes ? `${hours}h ${minutes}m` : `${hours} hours`
  return `${minutes} minutes`
}
