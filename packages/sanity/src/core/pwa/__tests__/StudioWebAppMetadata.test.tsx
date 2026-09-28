import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, waitFor} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {ActiveWorkspaceMatcherContext, WorkspacesContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type WorkspaceSummary} from '../../config/types'
import {StudioWebAppMetadata} from '../StudioWebAppMetadata'
import {type WebAppManifest} from '../types'

/** The manifest `sanity dev` and `sanity build` serve at `/static/manifest.webmanifest`. */
const GENERATED_MANIFEST: WebAppManifest = {
  icons: [
    {sizes: '96x96', src: '/static/favicon-96.png', type: 'image/png'},
    {sizes: '192x192', src: '/static/favicon-192.png', type: 'image/png'},
    {sizes: '512x512', src: '/static/favicon-512.png', type: 'image/png'},
  ],
}

function workspace(summary: Partial<WorkspaceSummary>): WorkspaceSummary {
  return {name: 'default', title: 'Default', basePath: '/', ...summary} as WorkspaceSummary
}

function mockManifestResponse(manifest: WebAppManifest | undefined) {
  const fetchMock = vi.fn(async () =>
    manifest
      ? new Response(JSON.stringify(manifest), {
          headers: {'content-type': 'application/manifest+json'},
        })
      : new Response('not found', {status: 404}),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderMetadata(workspaces: WorkspaceSummary[]) {
  function Wrapper({children}: {children: ReactNode}) {
    return (
      // oxlint-disable-next-line no-deprecated -- studioTheme is the jsdom test theme elsewhere too
      <ThemeProvider theme={studioTheme}>
        <LayerProvider>
          <WorkspacesContext.Provider value={workspaces}>
            <ActiveWorkspaceMatcherContext.Provider
              value={{activeWorkspace: workspaces[0], setActiveWorkspace: noop}}
            >
              {children}
            </ActiveWorkspaceMatcherContext.Provider>
          </WorkspacesContext.Provider>
        </LayerProvider>
      </ThemeProvider>
    )
  }

  return render(<StudioWebAppMetadata />, {wrapper: Wrapper})
}

/** React hoists the metadata into `<head>`; read the manifest back out of the rendered link. */
async function readRenderedManifest(): Promise<WebAppManifest> {
  const link = await waitFor(() => {
    const found = document.head.querySelector<HTMLLinkElement>(
      'link[rel~="manifest"][href^="data:"]',
    )
    if (!found) throw new Error('No studio manifest rendered')
    return found
  })

  const [, encoded] = link.getAttribute('href')!.split(',')
  return JSON.parse(decodeURIComponent(encoded))
}

beforeEach(() => {
  // Not reset in `afterEach`: vitest runs `afterEach` hooks in reverse registration order, so a
  // hook here would empty `<head>` before testing-library's `cleanup()` unmounts, and React
  // throws trying to remove metadata it hoisted into a node that is no longer attached.
  document.head.innerHTML = '<link href="/static/manifest.webmanifest" rel="manifest">'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StudioWebAppMetadata', () => {
  test('completes the icons-only manifest the sanity cli generates', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({})])

    const manifest = await readRenderedManifest()

    expect(manifest).toMatchObject({
      display: 'standalone',
      id: `${location.origin}/`,
      name: 'Sanity Studio',
      scope: `${location.origin}/`,
      short_name: 'Sanity Studio',
      start_url: `${location.origin}/`,
    })
    expect(manifest.theme_color).toEqual(expect.any(String))
  })

  test('inherits the icons the document declared, resolved to absolute urls', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({})])

    expect((await readRenderedManifest()).icons).toEqual([
      {sizes: '96x96', src: `${location.origin}/static/favicon-96.png`, type: 'image/png'},
      {sizes: '192x192', src: `${location.origin}/static/favicon-192.png`, type: 'image/png'},
      {sizes: '512x512', src: `${location.origin}/static/favicon-512.png`, type: 'image/png'},
    ])
  })

  test('removes the incomplete manifest link so the studio manifest is the one in effect', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({})])

    await readRenderedManifest()

    const links = document.head.querySelectorAll('link[rel~="manifest"]')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toMatch(/^data:application\/manifest\+json,/)
  })

  test('restores the document manifest link on unmount', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    const {unmount} = renderMetadata([workspace({})])

    await readRenderedManifest()
    unmount()

    await waitFor(() => {
      expect(document.head.querySelector('link[rel~="manifest"]')?.getAttribute('href')).toBe(
        '/static/manifest.webmanifest',
      )
    })
  })

  test('opens at the active workspace and scopes to every workspace of the studio', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([
      workspace({basePath: '/studio/staging', name: 'staging', title: 'Staging'}),
      workspace({basePath: '/studio/production', name: 'production', title: 'Production'}),
    ])

    expect(await readRenderedManifest()).toMatchObject({
      name: 'Staging',
      scope: `${location.origin}/studio/`,
      start_url: `${location.origin}/studio/staging/`,
    })
  })

  test('declares the apple metadata older ios versions need to open a standalone window', async () => {
    mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({title: 'Acme CMS'})])

    await readRenderedManifest()

    const content = (name: string) =>
      document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content')

    expect(content('apple-mobile-web-app-capable')).toBe('yes')
    expect(content('mobile-web-app-capable')).toBe('yes')
    expect(content('apple-mobile-web-app-title')).toBe('Acme CMS')
    expect(content('apple-mobile-web-app-status-bar-style')).toBe('default')
    expect(content('theme-color')).toEqual(expect.any(String))
  })

  test('leaves a document that already declares an installable manifest alone', async () => {
    mockManifestResponse({
      ...GENERATED_MANIFEST,
      display: 'standalone',
      name: 'Acme',
      start_url: '/',
    })
    renderMetadata([workspace({})])

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    expect(document.head.querySelector('link[href^="data:"]')).toBeNull()
    expect(document.head.querySelector('link[rel~="manifest"]')?.getAttribute('href')).toBe(
      '/static/manifest.webmanifest',
    )
    expect(document.head.querySelector('meta[name="apple-mobile-web-app-capable"]')).toBeNull()
  })

  test('leaves the document alone when the declared manifest cannot be read', async () => {
    mockManifestResponse(undefined)
    renderMetadata([workspace({})])

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    expect(document.head.querySelector('link[href^="data:"]')).toBeNull()
    expect(document.head.querySelector('link[rel~="manifest"]')?.getAttribute('href')).toBe(
      '/static/manifest.webmanifest',
    )
  })

  test('leaves a cross-origin manifest alone without requesting it', async () => {
    document.head.innerHTML =
      '<link href="https://cdn.example/manifest.webmanifest" rel="manifest">'
    const fetchMock = mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({})])

    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.head.querySelector('link[href^="data:"]')).toBeNull()
  })

  test('declares a manifest from the document icons when no manifest is declared', async () => {
    document.head.innerHTML = '<link href="/static/favicon.svg" rel="icon" type="image/svg+xml">'
    const fetchMock = mockManifestResponse(GENERATED_MANIFEST)
    renderMetadata([workspace({title: 'Acme CMS'})])

    const manifest = await readRenderedManifest()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(manifest).toMatchObject({
      icons: [{sizes: 'any', src: `${location.origin}/static/favicon.svg`, type: 'image/svg+xml'}],
      name: 'Acme CMS',
    })
  })
})
