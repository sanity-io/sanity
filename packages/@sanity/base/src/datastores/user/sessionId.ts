const sidPattern = /sid=[^&]{20,}/

export function consumeSessionId(): string | null {
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
