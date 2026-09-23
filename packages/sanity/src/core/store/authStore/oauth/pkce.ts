// PKCE (RFC 7636) and `state` helpers for the OAuth authorization request.

/** base64url without padding, as RFC 7636 appendix A requires. */
function base64url(bytes: ArrayBuffer | Uint8Array): string {
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(byteLength: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

/**
 * A code verifier: 32 random bytes, which encode to 43 characters, the RFC 7636 minimum.
 *
 * @internal
 */
export function createCodeVerifier(): string {
  return randomString(32)
}

/**
 * The `S256` code challenge for a verifier. `crypto.subtle` needs a secure context, which
 * `http://localhost` is.
 *
 * @internal
 */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(digest)
}

/**
 * The `state` value that binds the authorization response to the tab that started it.
 *
 * @internal
 */
export function createState(): string {
  return randomString(16)
}
