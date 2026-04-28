import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {ensureCdnCssLink} from '../ensureCdnCssLink'

const SANITY_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000'
const VISION_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000'
const SANITY_BY_APP_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity'
const VISION_BY_APP_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/@sanity__vision'

function addImportMap(imports: Record<string, string>) {
  const script = document.createElement('script')
  script.type = 'importmap'
  script.textContent = JSON.stringify({imports})
  document.head.appendChild(script)
}

function addStylesheetLink(href: string) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
  return link
}

describe('ensureCdnCssLink', () => {
  beforeEach(() => {
    // Reset the document head between tests
    document.head.innerHTML = ''
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  test('injects a stylesheet link derived from the JS module URL when loaded from modules.sanity-cdn', () => {
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${SANITY_IMPORT_MAP_URL}/index.css`)
  })

  test('injects for the by-app URL pattern as well', () => {
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    addImportMap({sanity: SANITY_BY_APP_IMPORT_MAP_URL})

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${SANITY_BY_APP_IMPORT_MAP_URL}/index.css`)
  })

  test('handles staging hostname', () => {
    const moduleUrl = 'https://modules.sanity-cdn.work/modules/v1/sanity/5.23.0/bare/index.mjs'
    const importMapUrl = 'https://sanity-cdn.work/v1/modules/sanity/default/%5E5.23.0/t1700000000'
    addImportMap({sanity: importMapUrl})

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${importMapUrl}/index.css`)
  })

  test('does nothing when module is not loaded from modules.sanity-cdn', () => {
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})

    ensureCdnCssLink('https://example.com/some/module/index.mjs', 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })

  test('does nothing for a relative or invalid module URL', () => {
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})

    ensureCdnCssLink('not-a-url', 'sanity')
    ensureCdnCssLink('', 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })

  test('does nothing when the import map has no matching sanity-cdn entry', () => {
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    //  addImportMap({sanity: ''}) <-- no import map url, so no CSS link is injected
    ensureCdnCssLink(moduleUrl, 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })

  test('does not inject when an existing matching link is already present for sanity', () => {
    // Simulate the CLI runtime script having already created the link
    addStylesheetLink(`${SANITY_IMPORT_MAP_URL}/index.css`)
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'

    ensureCdnCssLink(moduleUrl, 'sanity')
    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${SANITY_IMPORT_MAP_URL}/index.css`)
  })
  test('does not inject when an existing matching link is already present for @sanity__vision', () => {
    // Simulate the CLI runtime script having already created the link
    addStylesheetLink(`${VISION_IMPORT_MAP_URL}/index.css`)
    addImportMap({'@sanity__vision': VISION_IMPORT_MAP_URL})
    const moduleUrl =
      'https://modules.sanity-cdn.com/modules/v1/@sanity__vision/5.23.0/bare/index.mjs'

    ensureCdnCssLink(moduleUrl, '@sanity__vision')
    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${VISION_IMPORT_MAP_URL}/index.css`)
  })
  test('does nothing when stylesheet link are already present for sanity and @sanity__vision', () => {
    // Simulate the CLI runtime script having already created the link
    addStylesheetLink(`${VISION_IMPORT_MAP_URL}/index.css`)
    addStylesheetLink(`${SANITY_IMPORT_MAP_URL}/index.css`)
    addImportMap({'@sanity__vision': VISION_IMPORT_MAP_URL, 'sanity': SANITY_IMPORT_MAP_URL})
    const moduleUrl =
      'https://modules.sanity-cdn.com/modules/v1/@sanity__vision/5.23.0/bare/index.mjs'

    ensureCdnCssLink(moduleUrl, '@sanity__vision')
    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[0] as HTMLLinkElement).href).toBe(`${VISION_IMPORT_MAP_URL}/index.css`)
    expect((links[1] as HTMLLinkElement).href).toBe(`${SANITY_IMPORT_MAP_URL}/index.css`)
  })

  test('does not inject when an existing matching link is already present (by-app URL)', () => {
    addStylesheetLink(`${SANITY_BY_APP_IMPORT_MAP_URL}/index.css`)
    addImportMap({sanity: SANITY_BY_APP_IMPORT_MAP_URL})
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(`${SANITY_BY_APP_IMPORT_MAP_URL}/index.css`)
  })

  test('by-app appId matching packagePathSegment does not suppress injection for a different package', () => {
    const visionCssUrl = `${VISION_BY_APP_IMPORT_MAP_URL}/index.css`
    // appId is 'sanity', but the existing CSS link is for @sanity__vision — not for sanity itself.
    addStylesheetLink(visionCssUrl)
    const sanityByAppWithMatchingAppIdUrl =
      'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/sanity'
    addImportMap({sanity: sanityByAppWithMatchingAppIdUrl})
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[0] as HTMLLinkElement).href).toBe(visionCssUrl)
    expect((links[1] as HTMLLinkElement).href).toBe(`${sanityByAppWithMatchingAppIdUrl}/index.css`)
  })

  test('package detection is scoped — injects sanity link even when a vision link exists', () => {
    const visionCssUrl = `${VISION_IMPORT_MAP_URL}/index.css`
    addStylesheetLink(visionCssUrl)
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})
    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[0] as HTMLLinkElement).href).toBe(visionCssUrl)
    expect((links[1] as HTMLLinkElement).href).toBe(`${SANITY_IMPORT_MAP_URL}/index.css`)
  })

  test('ignores non-sanity-cdn stylesheet links when checking for duplicates', () => {
    addStylesheetLink('https://example.com/sanity/index.css') // <-- another css link, not from sanity-cdn
    addImportMap({sanity: SANITY_IMPORT_MAP_URL})

    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[1] as HTMLLinkElement).href).toBe(`${SANITY_IMPORT_MAP_URL}/index.css`)
  })

  test('does nothing when the import map package does not match packagePathSegment', () => {
    addImportMap({
      sanity:
        'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.21.0/@sanity__vision',
    })

    const moduleUrl = 'https://modules.sanity-cdn.com/modules/v1/sanity/5.23.0/bare/index.mjs'
    ensureCdnCssLink(moduleUrl, 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })
})
