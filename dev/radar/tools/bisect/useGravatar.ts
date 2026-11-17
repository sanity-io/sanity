import {useCallback, useEffect, useSyncExternalStore} from 'react'

/**
 * Gravatar URL for a commit author. Gravatar accepts SHA-256 email hashes, so
 * Web Crypto covers it without an md5 dependency — but `crypto.subtle` is
 * async, hence a module-level hash cache (one digest per distinct email per
 * session). The cache is read through `useSyncExternalStore`: a plain render
 * read of a mutable Map is impure, and the React Compiler may legitimately
 * memoize it away so the value never updates once the digest lands.
 * `d=identicon` gives bots and non-gravatar users a deterministic pattern
 * instead of a broken image.
 */

/**
 * GitHub noreply addresses (`12345+login@users.noreply.github.com`, or the
 * old `login@users.noreply.github.com`) never have a gravatar — but they name
 * the GitHub account, whose real avatar we can use directly (and
 * synchronously). Most commits in this repo use these.
 */
const GITHUB_NOREPLY_RE = /^(?:(\d+)\+)?([^@+]+)@users\.noreply\.github\.com$/

export function githubAvatarUrl(email: string, size: number): string | undefined {
  const match = GITHUB_NOREPLY_RE.exec(email)
  if (!match) return undefined
  const [, id, login] = match
  return id
    ? `https://avatars.githubusercontent.com/u/${id}?s=${size}&v=4`
    : `https://github.com/${encodeURIComponent(login)}.png?size=${size}`
}

const hashCache = new Map<string, string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function useAuthorAvatarUrl(
  author: {avatarUrl?: string; email?: string; login?: string},
  size = 66,
): string | undefined {
  const normalized = author.email?.trim().toLowerCase()
  // Priority: GitHub's own avatarUrl (collected by the sync — the only
  // correct source for bots, whose avatars live under /in/<app-id>), then a
  // noreply-email parse, then the synced login, then gravatar.
  const github =
    author.avatarUrl ??
    (normalized ? githubAvatarUrl(normalized, size) : undefined) ??
    (author.login
      ? `https://github.com/${encodeURIComponent(author.login)}.png?size=${size}`
      : undefined)
  const hash = useSyncExternalStore(
    subscribe,
    useCallback(() => (normalized ? hashCache.get(normalized) : undefined), [normalized]),
  )

  useEffect(() => {
    // GitHub-resolvable emails never need the gravatar digest
    if (!normalized || github || hashCache.has(normalized)) return undefined
    let cancelled = false
    void sha256Hex(normalized).then((digest) => {
      hashCache.set(normalized, digest)
      if (!cancelled) for (const listener of listeners) listener()
    })
    return () => {
      cancelled = true
    }
  }, [normalized, github])

  if (github) return github
  return hash ? `https://www.gravatar.com/avatar/${hash}?d=identicon&s=${size}` : undefined
}
