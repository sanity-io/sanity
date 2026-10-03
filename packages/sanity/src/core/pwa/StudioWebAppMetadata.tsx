import {getTheme_v2} from '@sanity/ui/theme'
import {useEffect, useMemo} from 'react'
import {useTheme} from 'styled-components'

import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'
import {useWorkspaces} from '../studio/workspaces/useWorkspaces'
import {useHostWebAppManifest} from './useHostWebAppManifest'
import {
  createWebAppManifest,
  isInstallableWebAppManifest,
  mergeWebAppManifest,
  resolveWebAppName,
  resolveWebAppScopePath,
  resolveWebAppStartPath,
  toWebAppManifestDataUrl,
} from './webAppManifest'

/**
 * Takes ownership of the document's `<link rel="manifest">`.
 *
 * Only the first manifest link in tree order is used, and React appends the metadata it hoists to
 * the end of `<head>` — so the studio's manifest only takes effect once the document's own link is
 * gone. The links are put back on unmount, for a studio embedded in an app that navigates away
 * from it client side.
 */
function useManifestLinkOwnership(manifestHref: string | undefined): void {
  useEffect(() => {
    if (!manifestHref) return undefined

    const displaced = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="manifest"]'),
    ).filter((link) => link.getAttribute('href') !== manifestHref)

    for (const link of displaced) link.remove()

    return () => {
      for (const link of displaced) document.head.append(link)
    }
  }, [manifestHref])
}

/**
 * Declares the metadata that makes a studio installable as an app, using React's document
 * metadata support to hoist it into `<head>`.
 *
 * The manifest is built for the workspace that is active, which a static file could not do: its
 * `name`, `start_url` and `id` are workspace specific, and its `scope` spans every workspace of
 * the studio so that switching workspace stays inside the installed window. It is serialised into
 * the `data:` URL of a `<link rel="manifest">`, which Chromium reads like any other manifest URL.
 *
 * A document that already declares an installable manifest is left alone, and members that
 * document did declare (icons, name, colours) win over the studio's defaults — so a studio that
 * ships its own `static/manifest.webmanifest` keeps it, and one that relies on the manifest
 * `sanity build` generates (icons only, which Chromium rejects as non-installable) gains the
 * members it was missing.
 *
 * Safari needs none of this to install a studio — `Add to Dock` on macOS and `Add to Home Screen`
 * on iOS 26 work for any page — so the legacy `apple-mobile-web-app-*` tags are declared alongside
 * the manifest to give older iOS versions the same standalone window, title and icon.
 *
 * @internal
 */
export function StudioWebAppMetadata(): React.JSX.Element | null {
  const {activeWorkspace} = useActiveWorkspace()
  const workspaces = useWorkspaces()
  const theme = useTheme()
  const host = useHostWebAppManifest()

  const themeColor = getTheme_v2(theme).color.bg
  const name = resolveWebAppName(activeWorkspace, {workspaceCount: workspaces.length})
  const workspaceBasePath = activeWorkspace.basePath || '/'

  const scopePath = useMemo(
    () => resolveWebAppScopePath(workspaces.map((workspace) => workspace.basePath || '/')),
    [workspaces],
  )

  const manifestHref = useMemo(() => {
    if (host.status !== 'resolved') return undefined
    if (isInstallableWebAppManifest(host.manifest)) return undefined

    const studioManifest = createWebAppManifest({
      icons: host.manifest.icons ?? [],
      name,
      origin: window.location.origin,
      scopePath,
      startPath: resolveWebAppStartPath(workspaceBasePath),
      themeColor,
    })

    return toWebAppManifestDataUrl(mergeWebAppManifest(studioManifest, host.manifest))
  }, [host, name, scopePath, themeColor, workspaceBasePath])

  useManifestLinkOwnership(manifestHref)

  if (!manifestHref) return null

  return (
    <>
      <link rel="manifest" href={manifestHref} />
      <meta name="theme-color" content={themeColor} />
      {/* Standardised replacement for the Apple tag below; Chromium warns when only the latter is present. */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={name} />
      {/* `black-translucent` draws behind the status bar, and the studio shell has no
          `safe-area-inset-top` padding to keep the navbar clear of it. */}
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </>
  )
}
