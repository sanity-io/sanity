// Token pattern used for extracting tokens from URL hash
const tokenPattern = /token=([^&]{32,})&?/

function readAndRemoveHashToken(): string | undefined {
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return undefined
  }

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

// Like the session ID, the token is removed from the URL as a side-effect as soon as this
// module loads, rather than when the first auth store is created: a studio that fails to
// boot (a schema error, a crashing plugin) never creates one, and would otherwise leave the
// token in the address bar and the session history. It is held here until an auth store
// consumes it, then cleared so it doesn't linger in memory.
let pendingToken = readAndRemoveHashToken()

export const consumeHashToken = (): string | undefined => {
  const token = pendingToken ?? readAndRemoveHashToken()
  pendingToken = undefined
  return token
}
