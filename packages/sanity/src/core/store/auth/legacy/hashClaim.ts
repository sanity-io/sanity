import {takeHashParam, takeStashedAuthHashParam} from './authHashParams'

const CLAIM_URL_HOSTS = new Set(['sanity.io', 'www.sanity.io', 'sanity.work', 'www.sanity.work'])

/**
 * Whether a value is safe to render as a claim link: a well-formed https URL on a Sanity host
 * with a `/claim/<token>` path. Applied at hash intake and again when reading the stored record
 * (see `unclaimedProjectStorage.ts`), so a tampered record can't become a clickable link.
 *
 * @internal
 */
export const isValidClaimUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    const segments = url.pathname.split('/').filter(Boolean)
    return (
      url.protocol === 'https:' &&
      CLAIM_URL_HOSTS.has(url.hostname) &&
      segments.length >= 2 &&
      segments[segments.length - 2] === 'claim'
    )
  } catch {
    return false
  }
}

function readAndRemoveHashClaim(): string | undefined {
  // Removed from the URL even when invalid (a bad fragment must never linger), and even when the
  // studio HTML already stashed one.
  const fromHash = takeHashParam('claim')
  const claimParam = takeStashedAuthHashParam('claim') ?? fromHash
  if (claimParam === undefined) {
    return undefined
  }

  let claimUrl: string
  try {
    claimUrl = decodeURIComponent(claimParam)
  } catch {
    return undefined
  }
  return isValidClaimUrl(claimUrl) ? claimUrl : undefined
}

// Taken at load like the token, and removed again when consumed in case a host restored the hash.
let pendingClaimUrl = readAndRemoveHashClaim()

export const consumeHashClaim = (): string | undefined => {
  const fromHash = readAndRemoveHashClaim()
  const claimUrl = pendingClaimUrl ?? fromHash
  pendingClaimUrl = undefined
  return claimUrl
}
