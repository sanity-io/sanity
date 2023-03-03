const sidPattern = /sid=[^&]{20,}/

function consumeSessionId(): string | null {
  // Are we in a browser-like environment?
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return null
  }

  // Does the hash contain a valid session ID?
  const hash = window.location.hash
  const [sidParam] = hash.match(sidPattern) || []
  if (!sidParam) {
    return null
  }

  // Extract just the sid from the hash
  const sid = sidParam.slice(sidParam.indexOf('=') + 1)

  // Remove the parameter from the URL
  const newHash = hash.replace(sidPattern, '')
  const newUrl = new URL(window.location.href)
  newUrl.hash = newHash.length > 1 ? newHash : ''
  history.replaceState(null, '', newUrl)

  return sid
}

// this module consumes the session ID as a side-effect as soon as its loaded
// to remove the session ID from the history (vs waiting to remove the sid hash
// until react mounts). Once it is consumed and loaded once, we don't want to
// keep it in-memory here, so we clear it out.
let sessionId = consumeSessionId()
export const getSessionId = (): string | null => {
  const id = sessionId
  if (id) {
    sessionId = null
  }
  return id
}
