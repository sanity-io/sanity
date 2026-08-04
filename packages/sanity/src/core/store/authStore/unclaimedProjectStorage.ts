import {supportsLocalStorage} from '../../util/supportsLocalStorage'
import {getUnclaimedProjectStorageKey} from './constants'
import {isValidClaimUrl} from './hashClaim'

/**
 * Claim record for a minted-but-unclaimed project. Written by the auth store when a `#claim=`
 * URL fragment is consumed (see `hashClaim.ts`), refined and eventually cleared by the
 * in-studio claim nudge. Plain localStorage, not live auth state: a corrupt record reads as
 * absent and gets replaced on the next write.
 *
 * @internal
 */
export interface UnclaimedProjectRecord {
  claimUrl: string
  expiresAt?: string
  lastLookupAt?: string
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
}

/** @internal */
export function readUnclaimedProjectRecord(projectId: string): UnclaimedProjectRecord | undefined {
  if (!supportsLocalStorage) return undefined
  try {
    const raw = localStorage.getItem(getUnclaimedProjectStorageKey(projectId))
    const record: unknown = raw ? JSON.parse(raw) : undefined
    // The claim URL is rendered as a link, so a stored value must pass the same allowlist as
    // hash intake — a tampered record reads as absent, like any other corruption.
    if (
      !record ||
      typeof record !== 'object' ||
      !('claimUrl' in record) ||
      typeof record.claimUrl !== 'string' ||
      !isValidClaimUrl(record.claimUrl)
    ) {
      return undefined
    }

    return {
      claimUrl: record.claimUrl,
      ...('expiresAt' in record && isValidDateString(record.expiresAt)
        ? {expiresAt: record.expiresAt}
        : {}),
      ...('lastLookupAt' in record && isValidDateString(record.lastLookupAt)
        ? {lastLookupAt: record.lastLookupAt}
        : {}),
    }
  } catch {
    return undefined
  }
}

/** @internal */
export function writeUnclaimedProjectRecord(
  projectId: string,
  record: UnclaimedProjectRecord,
): void {
  if (!supportsLocalStorage) return
  try {
    localStorage.setItem(getUnclaimedProjectStorageKey(projectId), JSON.stringify(record))
  } catch {
    // best-effort
  }
}

/** @internal */
export function clearUnclaimedProjectRecord(projectId: string): void {
  if (!supportsLocalStorage) return
  try {
    localStorage.removeItem(getUnclaimedProjectStorageKey(projectId))
  } catch {
    // best-effort
  }
}

/**
 * Store a claim URL consumed from the URL fragment. The fragment carries no expiry, so a
 * re-consumed URL for the same claim keeps the refinements already recorded.
 *
 * @internal
 */
export function recordHashClaimUrl(projectId: string, claimUrl: string): void {
  if (readUnclaimedProjectRecord(projectId)?.claimUrl === claimUrl) return
  writeUnclaimedProjectRecord(projectId, {claimUrl})
}

function getSnoozeKey(projectId: string): string {
  return `${getUnclaimedProjectStorageKey(projectId)}_snooze`
}

/** @internal */
export function readUnclaimedProjectSnoozedAt(projectId: string): string | undefined {
  if (!supportsLocalStorage) return undefined
  try {
    return localStorage.getItem(getSnoozeKey(projectId)) ?? undefined
  } catch {
    return undefined
  }
}

/** @internal */
export function writeUnclaimedProjectSnoozedAt(projectId: string, snoozedAt: string): void {
  if (!supportsLocalStorage) return
  try {
    localStorage.setItem(getSnoozeKey(projectId), snoozedAt)
  } catch {
    // best-effort
  }
}

/** @internal */
export function clearUnclaimedProjectSnooze(projectId: string): void {
  if (!supportsLocalStorage) return
  try {
    localStorage.removeItem(getSnoozeKey(projectId))
  } catch {
    // best-effort
  }
}
