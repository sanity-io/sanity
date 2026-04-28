import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {ensureCdnCssLink} from '../ensureCdnCssLink'

describe('ensureCdnCssLink', () => {
  beforeEach(() => {
    // Reset the document head between tests
    document.head.innerHTML = ''
  })

  afterEach(() => {
    document.head.innerHTML = ''
  })

  test('injects a stylesheet link derived from the JS module URL when loaded from sanity-cdn', () => {
    const moduleUrl =
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.mjs'

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('injects for the by-app URL pattern as well', () => {
    const moduleUrl =
      'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/index.mjs'

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/index.css',
    )
  })

  test('handles staging hostname', () => {
    const moduleUrl =
      'https://sanity-cdn.work/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.mjs'

    ensureCdnCssLink(moduleUrl, 'sanity')

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(1)
    expect((links[0] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.work/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('does nothing when module is not loaded from sanity-cdn', () => {
    ensureCdnCssLink('https://example.com/some/module/index.mjs', 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })

  test('does nothing for a relative or invalid module URL', () => {
    ensureCdnCssLink('not-a-url', 'sanity')
    ensureCdnCssLink('', 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })

  test('does not inject when an existing matching link is already present', () => {
    // Simulate the CLI runtime script having already created the link
    const existing = document.createElement('link')
    existing.rel = 'stylesheet'
    existing.href =
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1234567890/index.css'
    document.head.appendChild(existing)

    ensureCdnCssLink(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.mjs',
      'sanity',
    )

    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(1)
  })

  test('does not inject when an existing matching link is already present (by-app URL)', () => {
    const existing = document.createElement('link')
    existing.rel = 'stylesheet'
    existing.href =
      'https://sanity-cdn.com/v1/modules/by-app/abc123/t1234567890/%5E5.23.0/sanity/index.css'
    document.head.appendChild(existing)

    ensureCdnCssLink(
      'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/index.mjs',
      'sanity',
    )

    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(1)
  })

  test('by-app appId matching packagePathSegment does not suppress injection for a different package', () => {
    // appId is 'sanity', but the existing CSS link is for @sanity__vision — not for sanity itself.
    const existingVisionLink = document.createElement('link')
    existingVisionLink.rel = 'stylesheet'
    existingVisionLink.href =
      'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/@sanity__vision/index.css'
    document.head.appendChild(existingVisionLink)

    ensureCdnCssLink(
      'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/sanity/index.mjs',
      'sanity',
    )

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[0] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/@sanity__vision/index.css',
    )
    expect((links[1] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/by-app/sanity/t1700000000/%5E5.23.0/sanity/index.css',
    )
  })

  test('package detection is scoped — injects sanity link even when a vision link exists', () => {
    const visionLink = document.createElement('link')
    visionLink.rel = 'stylesheet'
    visionLink.href =
      'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/index.css'
    document.head.appendChild(visionLink)

    ensureCdnCssLink(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.mjs',
      'sanity',
    )

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[0] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/index.css',
    )
    expect((links[1] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('ignores non-sanity-cdn stylesheet links when checking for duplicates', () => {
    const otherLink = document.createElement('link')
    otherLink.rel = 'stylesheet'
    otherLink.href = 'https://example.com/sanity/index.css'
    document.head.appendChild(otherLink)

    ensureCdnCssLink(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.mjs',
      'sanity',
    )

    const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')]
    expect(links).toHaveLength(2)
    expect((links[1] as HTMLLinkElement).href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('does nothing when the module URL has no .mjs filename to derive from', () => {
    ensureCdnCssLink('https://sanity-cdn.com/v1/modules/sanity/default/foo/t1/', 'sanity')
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })
})
