import {useEffect, useState} from 'react'

import {readDocumentIcons} from './documentIcons'
import {type WebAppManifest} from './types'
import {absolutizeWebAppManifestUrls} from './webAppManifest'

/**
 * What the host document declares about its own app identity.
 *
 * - `pending` — a same-origin manifest is declared at `url` and is being read; render no install
 *   metadata until it resolves.
 * - `unavailable` — a manifest is declared but cannot be read (cross-origin, or the request
 *   failed). Leave the document alone rather than replacing a manifest we cannot inspect.
 * - `resolved` — the declared manifest with its URL members absolutised, or, for a document that
 *   declares no manifest, just the icons it declares through `<link rel="icon">`.
 *
 * @internal
 */
export type HostWebAppManifestState =
  | {status: 'pending'; url: string}
  | {status: 'unavailable'}
  | {status: 'resolved'; manifest: WebAppManifest}

const UNAVAILABLE: HostWebAppManifestState = {status: 'unavailable'}

/**
 * Finds the `<link rel="manifest">` the document was served with. Per the Web App Manifest spec
 * only the first one in tree order is used, so that is the one worth reading. `data:` URLs are
 * skipped: those are the studio's own, rendered by `StudioWebAppMetadata`.
 */
function findHostManifestLink(): HTMLLinkElement | undefined {
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel~="manifest"]')
  return Array.from(links).find((link) => !link.getAttribute('href')?.startsWith('data:'))
}

function isManifestObject(value: unknown): value is WebAppManifest {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * The part of the lookup that can be answered from the DOM alone: which manifest URL to read, or
 * the state to settle on when there is nothing to read.
 */
function readDeclaredManifest(): HostWebAppManifestState {
  if (typeof document === 'undefined') return UNAVAILABLE

  const link = findHostManifestLink()
  if (!link) return {status: 'resolved', manifest: {icons: readDocumentIcons(document)}}

  let url: URL
  try {
    url = new URL(link.href, document.baseURI)
  } catch {
    return UNAVAILABLE
  }

  // A cross-origin manifest cannot be read, and is not ours to take over.
  if (url.origin !== window.location.origin) return UNAVAILABLE

  return {status: 'pending', url: url.href}
}

/**
 * Reads the web app manifest the host document declares, so the studio can complete it instead of
 * replacing it. The document's own manifest link is read once, when the hook initialises: it does
 * not change, and re-reading later would find the link the studio itself rendered.
 *
 * @internal
 */
export function useHostWebAppManifest(): HostWebAppManifestState {
  const [state, setState] = useState<HostWebAppManifestState>(readDeclaredManifest)
  const pendingUrl = state.status === 'pending' ? state.url : undefined

  useEffect(() => {
    if (!pendingUrl) return undefined

    const controller = new AbortController()

    fetch(pendingUrl, {credentials: 'same-origin', signal: controller.signal})
      .then(async (response) => {
        if (!response.ok) throw new Error(`Manifest request failed with ${response.status}`)
        const manifest: unknown = await response.json()
        if (!isManifestObject(manifest)) throw new Error('Manifest is not a JSON object')
        return absolutizeWebAppManifestUrls(manifest, pendingUrl)
      })
      .then((manifest) => setState({status: 'resolved', manifest}))
      .catch(() => {
        if (controller.signal.aborted) return
        setState(UNAVAILABLE)
      })

    return () => controller.abort()
  }, [pendingUrl])

  return state
}
