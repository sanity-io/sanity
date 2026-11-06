import {describe, expect, test} from 'vitest'

import {type WebAppManifest} from '../types'
import {
  absolutizeWebAppManifestUrls,
  createWebAppManifest,
  DEFAULT_WEB_APP_NAME,
  isInstallableWebAppManifest,
  mergeWebAppManifest,
  resolveWebAppName,
  resolveWebAppScopePath,
  resolveWebAppStartPath,
  toWebAppManifestDataUrl,
} from '../webAppManifest'

/** The manifest `sanity build` and `sanity dev` generate today: icons and nothing else. */
const generatedStudioManifest: WebAppManifest = {
  icons: [
    {sizes: '96x96', src: 'https://studio.example/static/favicon-96.png', type: 'image/png'},
    {sizes: '192x192', src: 'https://studio.example/static/favicon-192.png', type: 'image/png'},
    {sizes: '512x512', src: 'https://studio.example/static/favicon-512.png', type: 'image/png'},
  ],
}

const icons = generatedStudioManifest.icons ?? []

describe('resolveWebAppScopePath', () => {
  test('scopes a studio mounted at the origin root to the whole origin', () => {
    expect(resolveWebAppScopePath(['/'])).toBe('/')
  })

  test('scopes a studio mounted under a sub path to that sub path', () => {
    expect(resolveWebAppScopePath(['/studio'])).toBe('/studio/')
  })

  test('scopes sibling workspaces to the directory they share', () => {
    expect(resolveWebAppScopePath(['/studio/production', '/studio/staging'])).toBe('/studio/')
    expect(resolveWebAppScopePath(['/production', '/staging'])).toBe('/')
  })

  test('does not treat a partial segment match as shared', () => {
    expect(resolveWebAppScopePath(['/studio', '/studiolite'])).toBe('/')
  })
})

describe('resolveWebAppStartPath', () => {
  test.each([
    ['/', '/'],
    ['/production', '/production/'],
    ['/studio/production', '/studio/production/'],
  ])('keeps %s inside its own scope as %s', (basePath, expected) => {
    expect(resolveWebAppStartPath(basePath)).toBe(expected)
  })

  test('start path is always contained by the scope path', () => {
    const basePaths = ['/studio']
    const startPath = resolveWebAppStartPath(basePaths[0])
    expect(startPath.startsWith(resolveWebAppScopePath(basePaths))).toBe(true)
  })
})

describe('resolveWebAppName', () => {
  test('uses the configured workspace title', () => {
    expect(resolveWebAppName({name: 'default', title: 'Acme CMS'}, {workspaceCount: 1})).toBe(
      'Acme CMS',
    )
  })

  test('falls back to the product name for a single workspace with a derived title', () => {
    expect(resolveWebAppName({name: 'default', title: 'Default'}, {workspaceCount: 1})).toBe(
      DEFAULT_WEB_APP_NAME,
    )
  })

  test('keeps the derived title when it distinguishes one workspace from another', () => {
    expect(resolveWebAppName({name: 'staging', title: 'Staging'}, {workspaceCount: 2})).toBe(
      'Staging',
    )
  })
})

describe('isInstallableWebAppManifest', () => {
  const installable: WebAppManifest = {
    display: 'standalone',
    icons,
    name: 'Acme CMS',
    start_url: 'https://studio.example/',
  }

  test('rejects the icons-only manifest the sanity cli generates', () => {
    expect(isInstallableWebAppManifest(generatedStudioManifest)).toBe(false)
  })

  test('accepts a manifest with a name, start url, display mode and both icon sizes', () => {
    expect(isInstallableWebAppManifest(installable)).toBe(true)
  })

  test('accepts short_name in place of name', () => {
    expect(isInstallableWebAppManifest({...installable, name: undefined, short_name: 'Acme'})).toBe(
      true,
    )
  })

  test('rejects a manifest that asks to stay in a browser tab', () => {
    expect(isInstallableWebAppManifest({...installable, display: 'browser'})).toBe(false)
  })

  test('accepts an installable display mode declared through display_override', () => {
    expect(
      isInstallableWebAppManifest({
        ...installable,
        display: 'browser',
        display_override: ['window-controls-overlay'],
      }),
    ).toBe(true)
  })

  test('accepts a scalable icon as satisfying every required size', () => {
    const svgOnly = [{sizes: 'any', src: 'https://studio.example/icon.svg', type: 'image/svg+xml'}]
    expect(isInstallableWebAppManifest({...installable, icons: svgOnly})).toBe(true)
  })

  test('rejects icons that are all too small', () => {
    const small = [{sizes: '96x96', src: 'https://studio.example/small.png'}]
    expect(isInstallableWebAppManifest({...installable, icons: small})).toBe(false)
  })

  test('ignores maskable-only icons when checking the required sizes', () => {
    const maskableOnly = icons.map((icon) => ({...icon, purpose: 'maskable'}))
    expect(isInstallableWebAppManifest({...installable, icons: maskableOnly})).toBe(false)
  })

  test('rejects a manifest that prefers a related native application', () => {
    expect(isInstallableWebAppManifest({...installable, prefer_related_applications: true})).toBe(
      false,
    )
  })
})

describe('absolutizeWebAppManifestUrls', () => {
  const manifestUrl = 'https://studio.example/static/manifest.webmanifest'

  test('resolves icon sources against the url the manifest was served from', () => {
    const absolutized = absolutizeWebAppManifestUrls(
      {icons: [{sizes: '192x192', src: 'favicon-192.png'}]},
      manifestUrl,
    )

    expect(absolutized.icons).toEqual([
      {sizes: '192x192', src: 'https://studio.example/static/favicon-192.png'},
    ])
  })

  test('resolves root relative urls against the origin', () => {
    const absolutized = absolutizeWebAppManifestUrls(
      {scope: '/', start_url: '/production'},
      manifestUrl,
    )

    expect(absolutized).toMatchObject({
      scope: 'https://studio.example/',
      start_url: 'https://studio.example/production',
    })
  })

  test('drops icons with an unresolvable source rather than passing them through', () => {
    const absolutized = absolutizeWebAppManifestUrls(
      // oxlint-disable-next-line no-explicit-any -- a manifest read off the network is untrusted
      {icons: [{src: 42} as any, {sizes: 'any', src: 'icon.svg'}]},
      manifestUrl,
    )

    expect(absolutized.icons).toEqual([
      {sizes: 'any', src: 'https://studio.example/static/icon.svg'},
    ])
  })

  test('leaves members it does not resolve untouched', () => {
    expect(absolutizeWebAppManifestUrls({name: 'Acme CMS'}, manifestUrl)).toEqual({
      name: 'Acme CMS',
    })
  })
})

describe('createWebAppManifest', () => {
  const manifest = createWebAppManifest({
    icons,
    name: 'Acme CMS',
    origin: 'https://studio.example',
    scopePath: '/',
    startPath: '/production/',
    themeColor: '#13141b',
  })

  test('declares every member chromium requires to offer an install', () => {
    expect(isInstallableWebAppManifest(manifest)).toBe(true)
  })

  test('opens at the active workspace but scopes to the whole studio', () => {
    expect(manifest).toMatchObject({
      id: 'https://studio.example/production/',
      scope: 'https://studio.example/',
      start_url: 'https://studio.example/production/',
    })
  })

  test('uses the studio background colour for the window and splash screen', () => {
    expect(manifest).toMatchObject({background_color: '#13141b', theme_color: '#13141b'})
  })

  test('omits the colour members when the theme colour is unknown', () => {
    const colourless = createWebAppManifest({
      icons,
      name: 'Acme CMS',
      origin: 'https://studio.example',
      scopePath: '/',
      startPath: '/',
    })

    expect(colourless).not.toHaveProperty('theme_color')
    expect(colourless).not.toHaveProperty('background_color')
  })
})

describe('mergeWebAppManifest', () => {
  const studioManifest = createWebAppManifest({
    icons,
    name: 'Sanity Studio',
    origin: 'https://studio.example',
    scopePath: '/',
    startPath: '/',
    themeColor: '#13141b',
  })

  test('fills in the members the generated manifest is missing', () => {
    const merged = mergeWebAppManifest(studioManifest, generatedStudioManifest)

    expect(merged).toMatchObject({
      display: 'standalone',
      icons,
      name: 'Sanity Studio',
      start_url: 'https://studio.example/',
    })
  })

  test('lets the host document win where it declared a member itself', () => {
    const merged = mergeWebAppManifest(studioManifest, {
      ...generatedStudioManifest,
      display: 'minimal-ui',
      name: 'Acme CMS',
    })

    expect(merged).toMatchObject({display: 'minimal-ui', name: 'Acme CMS'})
  })

  test('treats an absent or empty member as not declared', () => {
    const merged = mergeWebAppManifest(studioManifest, {icons: [], name: undefined})

    expect(merged).toMatchObject({icons, name: 'Sanity Studio'})
  })

  test('passes unknown members through', () => {
    const merged = mergeWebAppManifest(studioManifest, {shortcuts: [{name: 'Inbox', url: '/'}]})

    expect(merged.shortcuts).toEqual([{name: 'Inbox', url: '/'}])
  })
})

describe('toWebAppManifestDataUrl', () => {
  test('serialises to a data url a browser parses as a manifest', () => {
    const manifest = {name: 'Acme CMS — Sanity Studio', start_url: 'https://studio.example/'}
    const url = toWebAppManifestDataUrl(manifest)

    expect(url.startsWith('data:application/manifest+json,')).toBe(true)
    expect(JSON.parse(decodeURIComponent(url.split(',')[1]))).toEqual(manifest)
  })
})
