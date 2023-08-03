// Trailing '&' included so we can replace `#sid=foo&bar=baz` with `#bar=baz`
const sidPattern = /sid=([^&]{20,})&?/

function consumeSessionId(): string | null {
  // Are we in a browser-like environment?
  if (typeof window === 'undefined' || typeof window.location !== 'object') {
    return null
  }

  // Does the hash contain a valid session ID?
  const hash = window.location.hash

  // The first element will be the entire match, including `sid=` - we only care about
  // the first _group_, being the actual _value_ of the parameter, thus the leading comma
  const [, sidParam] = hash.match(sidPattern) || []
  if (!sidParam) {
    return null
  }

  // Remove the parameter from the URL
  const newHash = hash.replace(sidPattern, '')
  const newUrl = new URL(window.location.href)
  newUrl.hash = newHash.length > 1 ? newHash : ''
  history.replaceState(null, '', newUrl)

  return sidParam
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
