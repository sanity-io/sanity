import {useEffect, useState} from 'react'

import {useClient} from '../../hooks'
import {getAuthTokenStorageKey} from '../../store/authStore/constants'
import {
  clearUnclaimedProjectRecord,
  clearUnclaimedProjectSnooze,
  readUnclaimedProjectRecord,
  type UnclaimedProjectRecord,
  writeUnclaimedProjectRecord,
} from '../../store/authStore/unclaimedProjectStorage'
import {supportsLocalStorage} from '../../util/supportsLocalStorage'
import {useWorkspace} from '../workspace'

const PROJECTS_API_VERSION = 'v2026-05-04'
const PROVISION_API_VERSION = 'v2026-06-23'

/** Unclaimed projects are hard-deleted this long after mint. */
const UNCLAIMED_PROJECT_TTL_MS = 72 * 3_600_000

/** Focus-driven project reads are throttled to this window. */
const PROJECT_CHECK_INTERVAL_MS = 5 * 60_000

/** The unauthenticated provision lookup shares a ~20/hour per-IP budget with the CLI. */
const CLAIM_LOOKUP_INTERVAL_MS = 30 * 60_000

/** Identity provider of the pre-claim robot token. */
const ROBOT_PROVIDER = 'sanity-token'

/** Holding organization that owns every minted-but-unclaimed project. */
const UNCLAIMED_ORGANIZATION_ID = 'oSystemUnclaimed'

/** @internal */
export type UnclaimedProjectState =
  | {
      status: 'unclaimed'
      claimUrl: string | undefined
      expiresAt: Date
      /** The lookup reported the claim link spent or gone — don't point the user at it. */
      claimLinkSpent?: boolean
    }
  | {status: 'claimed'}
  | {status: 'expired'}

interface ClaimLookupResponse {
  expiresAt?: string | null
  state?: 'claimable' | 'claimed' | 'expired'
}

// Claim tokens are base64url; anything else must not reach the lookup URL we build from it.
function claimTokenFromClaimUrl(claimUrl: string): string | undefined {
  try {
    const token = new URL(claimUrl).pathname.split('/').findLast(Boolean)
    return token && /^[\w-]+$/.test(token) ? token : undefined
  } catch {
    return undefined
  }
}

/**
 * Claim lifecycle of the current project.
 * Defaults to `undefined` when the project wasn't created via `sanity new` or public provisioning APIs.
 *
 * @internal
 */
export function useUnclaimedProject(): UnclaimedProjectState | undefined {
  const {currentUser, projectId} = useWorkspace()
  const client = useClient({apiVersion: PROJECTS_API_VERSION})
  const isRobot = currentUser?.provider === ROBOT_PROVIDER
  const [state, setState] = useState<UnclaimedProjectState>()

  // A workspace switch can swap the project or the identity under the mounted layout — reset
  // during render so a previous project's nudge never lingers.
  const sessionKey = `${projectId}:${isRobot}`
  const [prevSessionKey, setPrevSessionKey] = useState(sessionKey)
  if (prevSessionKey !== sessionKey) {
    setPrevSessionKey(sessionKey)
    setState(undefined)
  }

  useEffect(() => {
    if (!isRobot) {
      // An unclaimed project has no human members, so a human session means any stored claim
      // record is stale — storage never outlives the state that justified it.
      clearUnclaimedProjectRecord(projectId)
      return undefined
    }

    let disposed = false
    let terminal = false
    let lastCheckedAt = 0
    let lookupSawNotFound = false
    let claimLinkSpent = false

    const update = (next: UnclaimedProjectState) => {
      if (!disposed) setState(next)
    }

    const finishClaimed = () => {
      terminal = true
      clearUnclaimedProjectRecord(projectId)
      clearUnclaimedProjectSnooze(projectId)
      update({status: 'claimed'})
    }

    const finishExpired = () => {
      terminal = true
      clearUnclaimedProjectRecord(projectId)
      clearUnclaimedProjectSnooze(projectId)
      if (supportsLocalStorage) {
        try {
          localStorage.removeItem(getAuthTokenStorageKey(projectId))
        } catch {
          // best-effort
        }
      }
      update({status: 'expired'})
    }

    const dropClaimRecord = () => {
      claimLinkSpent = true
      clearUnclaimedProjectRecord(projectId)
      if (!disposed) {
        setState((prev) =>
          prev?.status === 'unclaimed'
            ? {...prev, claimUrl: undefined, claimLinkSpent: true}
            : prev,
        )
      }
    }

    const refineFromLookup = async (record: UnclaimedProjectRecord, localExpiry: number) => {
      const claimToken = claimTokenFromClaimUrl(record.claimUrl)
      if (!claimToken) return
      const lastLookupAt = record.lastLookupAt ? new Date(record.lastLookupAt).getTime() : 0
      if (Date.now() - lastLookupAt < CLAIM_LOOKUP_INTERVAL_MS) return

      const throttled = {...record, lastLookupAt: new Date().toISOString()}

      let response: Response
      try {
        const {apiHost} = client.config()
        response = await fetch(`${apiHost}/${PROVISION_API_VERSION}/provision/${claimToken}/lookup`)
      } catch {
        if (!disposed && !terminal) writeUnclaimedProjectRecord(projectId, throttled)
        return
      }

      if (disposed || terminal) return

      writeUnclaimedProjectRecord(projectId, throttled)

      if (response.status === 404) {
        if (lookupSawNotFound || Date.now() > localExpiry) dropClaimRecord()
        lookupSawNotFound = true
        return
      }

      if (!response.ok) return

      let data: ClaimLookupResponse
      try {
        data = await response.json()
      } catch {
        return
      }
      if (disposed || terminal) return
      if (data.state === 'claimed') {
        finishClaimed()
      } else if (data.state === 'expired') {
        dropClaimRecord()
      } else if (data.state === 'claimable' && data.expiresAt) {
        const expiresAt = new Date(data.expiresAt)
        if (Number.isNaN(expiresAt.getTime())) return
        claimLinkSpent = false
        writeUnclaimedProjectRecord(projectId, {...throttled, expiresAt: data.expiresAt})
        update({status: 'unclaimed', claimUrl: record.claimUrl, expiresAt, claimLinkSpent: false})
      }
    }

    const check = async () => {
      if (terminal) return
      lastCheckedAt = Date.now()

      let project: {createdAt?: string; organizationId?: string}
      try {
        project = await client.request({uri: `/projects/${projectId}`, tag: 'unclaimed-project'})
      } catch (err) {
        const statusCode = (err as {statusCode?: number} | null)?.statusCode
        if (statusCode === 404 || statusCode === 401) finishExpired()
        return
      }
      if (disposed || terminal) return
      // A response without an organization id is unverifiable, not a claim: fail open.
      if (!project.organizationId) return
      if (project.organizationId !== UNCLAIMED_ORGANIZATION_ID) {
        finishClaimed()
        return
      }

      const record = readUnclaimedProjectRecord(projectId)
      const expiresAt = record?.expiresAt
        ? new Date(record.expiresAt)
        : new Date(new Date(project.createdAt ?? Date.now()).getTime() + UNCLAIMED_PROJECT_TTL_MS)
      if (!disposed) {
        setState((prev) => ({
          status: 'unclaimed',
          claimUrl: record?.claimUrl,
          expiresAt: !record && prev?.status === 'unclaimed' ? prev.expiresAt : expiresAt,
          claimLinkSpent,
        }))
      }
      if (record) await refineFromLookup(record, expiresAt.getTime())
    }

    void check()

    let pendingCheck: ReturnType<typeof setTimeout> | undefined
    const onFocus = () => {
      const wait = PROJECT_CHECK_INTERVAL_MS - (Date.now() - lastCheckedAt)
      if (wait <= 0) {
        void check()
      } else if (!pendingCheck) {
        pendingCheck = setTimeout(() => {
          pendingCheck = undefined
          void check()
        }, wait)
      }
    }
    window.addEventListener('focus', onFocus)

    // The auth store consumes a `#claim=` fragment pasted into the open tab and writes the
    // record (see hashClaim.ts); pick it up here without waiting for the next check.
    const onHashChange = () => {
      const record = readUnclaimedProjectRecord(projectId)
      if (!record || disposed) return
      claimLinkSpent = false
      setState((prev) =>
        prev?.status === 'unclaimed'
          ? {
              ...prev,
              claimUrl: record.claimUrl,
              expiresAt: record.expiresAt ? new Date(record.expiresAt) : prev.expiresAt,
              claimLinkSpent: false,
            }
          : prev,
      )
    }
    window.addEventListener('hashchange', onHashChange)

    return () => {
      disposed = true
      if (pendingCheck) clearTimeout(pendingCheck)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [client, isRobot, projectId])

  return state
}
