import {useEffect, useRef, useState} from 'react'
import {exhaustMap, filter, fromEvent, merge, of, Subject, takeUntil, tap, timer} from 'rxjs'

import {useClient} from '../../hooks/useClient'
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

/** While a claim is in progress, recheck often enough for the Studio to transition live. */
const CLAIM_STATUS_POLL_INTERVAL_MS = 10_000

/** Stop elevated polling if the claim flow is abandoned. */
const CLAIM_STATUS_POLL_DURATION_MS = 10 * 60_000

/** The unauthenticated provision lookup shares a ~20/hour per-IP budget with the CLI. */
const CLAIM_LOOKUP_INTERVAL_MS = 30 * 60_000

/** Identity provider of the pre-claim robot token. @internal */
export const ROBOT_PROVIDER = 'sanity-token'

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
  | {status: 'claimed'; email?: string}
  | {status: 'expired'}

interface ProjectMember {
  id?: string
  isRobot?: boolean
}

interface ProjectResponse {
  createdAt?: string
  organizationId?: string
  members?: ProjectMember[]
}

interface ClaimLookupResponse {
  expiresAt?: string | null
  state?: 'claimable' | 'claimed' | 'expired'
}

interface UseUnclaimedProjectOptions {
  /** Timestamp set when the claim flow is opened for this project. */
  claimAttemptedAt?: number
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

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) return undefined
  return typeof error.statusCode === 'number' ? error.statusCode : undefined
}

/**
 * Claim lifecycle of the current project.
 * Defaults to `undefined` when the project wasn't created via `sanity new` or public provisioning APIs.
 *
 * @internal
 */
export function useUnclaimedProject({claimAttemptedAt}: UseUnclaimedProjectOptions = {}):
  | UnclaimedProjectState
  | undefined {
  const {auth, currentUser, projectId} = useWorkspace()
  const client = useClient({apiVersion: PROJECTS_API_VERSION})
  const isRobot = currentUser?.provider === ROBOT_PROVIDER
  const sessionKey = `${projectId}:${isRobot}`
  const provenanceRef = useRef({sessionKey, seenUnclaimed: false})
  const [sessionState, setSessionState] = useState<{
    sessionKey: string
    value: UnclaimedProjectState
  }>()
  // A workspace switch can swap the project or identity under the mounted layout. Tagging the
  // async state makes the previous session disappear immediately without setting state in render.
  const state = sessionState?.sessionKey === sessionKey ? sessionState.value : undefined

  useEffect(() => {
    if (provenanceRef.current.sessionKey !== sessionKey) {
      provenanceRef.current = {sessionKey, seenUnclaimed: false}
      setSessionState(undefined)
    }
  }, [sessionKey])

  useEffect(() => {
    if (!isRobot) return undefined

    let disposed = false
    let terminal = false
    let lastCheckedAt = 0
    let lookupSawNotFound = false
    let claimLinkSpent = false
    let checkInFlight = false
    const claimPollingStopped$ = new Subject<void>()

    const stopClaimPolling = () => {
      claimPollingStopped$.next()
      claimPollingStopped$.complete()
    }

    const getRemainingClaimPollingDuration = () => {
      if (claimAttemptedAt === undefined) return 0
      const elapsed = Math.max(0, Date.now() - claimAttemptedAt)
      return Math.max(0, CLAIM_STATUS_POLL_DURATION_MS - elapsed)
    }

    const isClaimPollingActive = () => getRemainingClaimPollingDuration() > 0

    const hasSeenUnclaimed = () =>
      provenanceRef.current.sessionKey === sessionKey && provenanceRef.current.seenUnclaimed

    const update = (next: UnclaimedProjectState) => {
      if (!disposed) setSessionState({sessionKey, value: next})
    }

    const finishClaimed = (members?: ProjectMember[]) => {
      terminal = true
      stopClaimPolling()
      clearUnclaimedProjectRecord(projectId)
      clearUnclaimedProjectSnooze(projectId)
      update({status: 'claimed'})

      const humanMembers = members?.filter(
        (member): member is ProjectMember & {id: string} =>
          member.isRobot === false && typeof member.id === 'string' && Boolean(member.id),
      )
      if (humanMembers?.length !== 1) return

      void client
        .request<{email?: string}>({
          uri: `/users/${humanMembers[0].id}`,
          tag: 'unclaimed-project.claimant',
        })
        .then((user) => {
          const email = typeof user.email === 'string' ? user.email.trim() : ''
          if (!disposed && email) update({status: 'claimed', email})
        })
        .catch(() => {
          // The targeted label is optional; keep the generic sign-in CTA on any lookup failure.
        })
    }

    const finishExpired = () => {
      terminal = true
      stopClaimPolling()
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
      void auth.logout?.()
    }

    const dropClaimRecord = () => {
      claimLinkSpent = true
      clearUnclaimedProjectRecord(projectId)
      if (!disposed) {
        setSessionState((prev) => {
          const value = prev?.sessionKey === sessionKey ? prev.value : undefined
          return value?.status === 'unclaimed'
            ? {
                sessionKey,
                value: {...value, claimUrl: undefined, claimLinkSpent: true},
              }
            : prev
        })
      }
    }

    const refineFromLookup = async (record: UnclaimedProjectRecord, localExpiry?: number) => {
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
        if (lookupSawNotFound || (localExpiry !== undefined && Date.now() > localExpiry)) {
          dropClaimRecord()
        }
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

    const performCheck = async () => {
      let project: ProjectResponse
      try {
        project = await client.request({uri: `/projects/${projectId}`, tag: 'unclaimed-project'})
      } catch (err) {
        const statusCode = getStatusCode(err)
        const hasMintProvenance =
          hasSeenUnclaimed() || Boolean(readUnclaimedProjectRecord(projectId))
        if (statusCode === 404 && hasMintProvenance) finishExpired()
        return
      }
      if (disposed || terminal) return
      // A response without an organization id is unverifiable, not a claim: fail open.
      if (!project.organizationId) return
      const record = readUnclaimedProjectRecord(projectId)
      if (project.organizationId !== UNCLAIMED_ORGANIZATION_ID) {
        if (hasSeenUnclaimed() || record) finishClaimed(project.members)
        return
      }

      provenanceRef.current = {sessionKey, seenUnclaimed: true}
      const createdAt = project.createdAt ? new Date(project.createdAt) : undefined
      const derivedExpiresAt =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? new Date(createdAt.getTime() + UNCLAIMED_PROJECT_TTL_MS)
          : undefined
      const expiresAt = record?.expiresAt ? new Date(record.expiresAt) : derivedExpiresAt
      if (expiresAt && !disposed) {
        setSessionState((prev) => {
          const value = prev?.sessionKey === sessionKey ? prev.value : undefined
          return {
            sessionKey,
            value: {
              status: 'unclaimed',
              claimUrl: record?.claimUrl,
              expiresAt: !record && value?.status === 'unclaimed' ? value.expiresAt : expiresAt,
              claimLinkSpent,
            },
          }
        })
      }
      if (record) await refineFromLookup(record, expiresAt?.getTime())
    }

    const check = async () => {
      if (terminal || checkInFlight) return
      checkInFlight = true
      lastCheckedAt = Date.now()

      try {
        await performCheck()
      } catch {
        // Lifecycle checks are best-effort. Keep the nudge quiet and allow a later trigger to retry.
      }
      checkInFlight = false
    }

    const remainingClaimPollingDuration = getRemainingClaimPollingDuration()
    const initialAndPolling$ = remainingClaimPollingDuration
      ? timer(0, CLAIM_STATUS_POLL_INTERVAL_MS).pipe(
          takeUntil(timer(remainingClaimPollingDuration)),
          takeUntil(claimPollingStopped$),
        )
      : of(0)
    const focus$ = fromEvent(window, 'focus').pipe(
      exhaustMap(() => {
        if (isClaimPollingActive()) return of(0)
        return timer(Math.max(0, PROJECT_CHECK_INTERVAL_MS - (Date.now() - lastCheckedAt)))
      }),
    )
    const visibleDuringClaim$ = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible' && isClaimPollingActive()),
    )
    const checkSubscription = merge(initialAndPolling$, focus$, visibleDuringClaim$)
      .pipe(tap(() => void check()))
      .subscribe()

    // The auth store consumes a `#claim=` fragment pasted into the open tab and writes the
    // record (see hashClaim.ts); pick it up here without waiting for the next check.
    const onHashChange = () => {
      const record = readUnclaimedProjectRecord(projectId)
      if (!record || disposed) return
      claimLinkSpent = false
      setSessionState((prev) => {
        const value = prev?.sessionKey === sessionKey ? prev.value : undefined
        return value?.status === 'unclaimed'
          ? {
              sessionKey,
              value: {
                ...value,
                claimUrl: record.claimUrl,
                expiresAt: record.expiresAt ? new Date(record.expiresAt) : value.expiresAt,
                claimLinkSpent: false,
              },
            }
          : prev
      })
    }
    const hashSubscription = fromEvent(window, 'hashchange').pipe(tap(onHashChange)).subscribe()

    return () => {
      disposed = true
      stopClaimPolling()
      checkSubscription.unsubscribe()
      hashSubscription.unsubscribe()
    }
  }, [auth, claimAttemptedAt, client, isRobot, projectId, sessionKey])

  return state
}
