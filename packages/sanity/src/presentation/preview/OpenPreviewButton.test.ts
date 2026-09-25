import {describe, expect, test} from 'vitest'

import {resolveOpenPreviewUrl} from './resolveOpenPreviewUrl'

describe('resolveOpenPreviewUrl', () => {
  test('routes through preview mode with the current secret and preview state', () => {
    const url = new URL(
      resolveOpenPreviewUrl({
        perspective: 'drafts',
        previewLocationRoute: '/products/shoes?color=red#details',
        previewMode: {enable: '/api/draft-mode/enable'},
        previewUrlSecret: 'session-secret',
        targetOrigin: 'https://example.com',
        variant: 'summer-release',
      }),
    )

    expect(url.origin).toBe('https://example.com')
    expect(url.pathname).toBe('/api/draft-mode/enable')
    expect(url.searchParams.get('sanity-preview-secret')).toBe('session-secret')
    expect(url.searchParams.get('sanity-preview-pathname')).toBe(
      '/products/shoes?color=red&sanity-preview-perspective=drafts&sanity-preview-variant=summer-release#details',
    )
    expect(url.searchParams.get('sanity-preview-perspective')).toBe('drafts')
    expect(url.searchParams.get('sanity-preview-variant')).toBe('summer-release')
  })

  test('uses an absolute preview mode URL', () => {
    const url = new URL(
      resolveOpenPreviewUrl({
        perspective: 'published',
        previewLocationRoute: '/products/shoes',
        previewMode: {enable: 'https://preview.example.com/enable'},
        previewUrlSecret: 'session-secret',
        targetOrigin: 'https://example.com',
        variant: undefined,
      }),
    )

    expect(url.origin).toBe('https://preview.example.com')
    expect(url.searchParams.get('sanity-preview-pathname')).toBe(
      '/products/shoes?sanity-preview-perspective=published',
    )
    expect(url.searchParams.get('sanity-preview-variant')).toBeNull()
  })

  test('does not redirect back to the enable route when it is also the preview page', () => {
    const url = new URL(
      resolveOpenPreviewUrl({
        perspective: 'drafts',
        previewLocationRoute: '/api/preview',
        previewMode: {enable: '/api/preview'},
        previewUrlSecret: 'session-secret',
        targetOrigin: 'https://example.com',
        variant: undefined,
      }),
    )

    expect(url.pathname).toBe('/api/preview')
    expect(url.searchParams.get('sanity-preview-secret')).toBe('session-secret')
    expect(url.searchParams.get('sanity-preview-perspective')).toBe('drafts')
    expect(url.searchParams.has('sanity-preview-pathname')).toBe(false)
  })

  test.each([
    ['preview mode is unavailable', null, 'session-secret'],
    ['the preview secret is unavailable', {enable: '/api/draft-mode/enable'}, null],
  ])('opens the preview directly when %s', (_, previewMode, previewUrlSecret) => {
    expect(
      resolveOpenPreviewUrl({
        perspective: 'drafts',
        previewLocationOrigin: '',
        previewLocationRoute: '/products/shoes?color=red#details',
        previewMode,
        previewUrlSecret,
        targetOrigin: 'https://example.com',
        variant: undefined,
      }),
    ).toBe('/products/shoes?color=red&sanity-preview-perspective=drafts#details')
  })
})
