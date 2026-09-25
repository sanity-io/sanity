import {describe, expect, test} from 'vitest'

import {resolvePreviewLocationRoute} from './resolvePreviewLocationRoute'

const targetOrigin = 'https://example.com'

describe('resolvePreviewLocationRoute', () => {
  test('keeps the pathname, search and fragment of the preview URL without its preview parameters', () => {
    expect(
      resolvePreviewLocationRoute(
        'https://example.com/products/shoes?color=red&sanity-preview-perspective=drafts#details',
        targetOrigin,
      ),
    ).toBe('/products/shoes?color=red#details')
  })

  test('resolves a relative preview URL', () => {
    expect(resolvePreviewLocationRoute('/about#team', targetOrigin)).toBe('/about#team')
  })

  test('uses the route a preview mode enable URL redirects to, including its fragment', () => {
    const enableUrl = new URL('/api/draft-mode/enable', targetOrigin)
    enableUrl.searchParams.set('sanity-preview-secret', 'session-secret')
    enableUrl.searchParams.set('sanity-preview-pathname', '/products/shoes?color=red#details')
    enableUrl.searchParams.set('sanity-preview-perspective', 'drafts')

    expect(resolvePreviewLocationRoute(enableUrl.toString(), targetOrigin)).toBe(
      '/products/shoes?color=red#details',
    )
  })

  test('defaults to the root route', () => {
    expect(resolvePreviewLocationRoute(undefined, targetOrigin)).toBe('/')
  })
})
