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

export const consumeHashClaim = (): string | undefined => {
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return undefined
  }

  // The fragment is a `&`-separated param list; take the `claim` param wherever it sits
  // (humans re-paste and reorder URLs) and leave every other param alone.
  const params = window.location.hash.replace(/^#/, '').split('&')
  const claimIndex = params.findIndex((param) => param.startsWith('claim='))
  if (claimIndex === -1) {
    return undefined
  }
  const claimParam = params[claimIndex].slice('claim='.length)

  // Remove the claim URL from the URL even when invalid — a bad fragment must never linger
  params.splice(claimIndex, 1)
  const newUrl = new URL(window.location.href)
  newUrl.hash = params.filter(Boolean).join('&')
  history.replaceState(null, '', newUrl)

  let claimUrl: string
  try {
    claimUrl = decodeURIComponent(claimParam)
  } catch {
    return undefined
  }
  return isValidClaimUrl(claimUrl) ? claimUrl : undefined
}
