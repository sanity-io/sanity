export const consumeHashToken = (): string | undefined => {
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return undefined
  }

  // Token pattern used for extracting tokens from URL hash
  const tokenPattern = /token=([^&]{32,})&?/
  const [, tokenParam] = window.location.hash.match(tokenPattern) || []
  if (!tokenParam) {
    return undefined
  }

  // Remove the token from URL for security
  const newHash = window.location.hash.replace(tokenPattern, '')
  const newUrl = new URL(window.location.href)
  newUrl.hash = newHash.length > 1 ? newHash : ''
  history.replaceState(null, '', newUrl)

  return tokenParam
}
