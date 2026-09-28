import {describe, expect, test} from 'vitest'

import {createPreviewModeEnableUrl} from '../createPreviewModeEnableUrl'

describe('createPreviewModeEnableUrl', () => {
  test('sets the secret, perspective and variant, and the page to redirect to', () => {
    const url = createPreviewModeEnableUrl({
      enable: '/api/draft-mode/enable',
      perspective: ['rSummer', 'drafts'],
      previewUrl: new URL('https://example.com/products/shoes?color=red#details'),
      previewUrlSecret: 'session-secret',
      variant: 'summer-release',
    })

    expect(url.origin).toBe('https://example.com')
    expect(url.pathname).toBe('/api/draft-mode/enable')
    expect(url.searchParams.get('sanity-preview-secret')).toBe('session-secret')
    expect(url.searchParams.get('sanity-preview-perspective')).toBe('rSummer,drafts')
    expect(url.searchParams.get('sanity-preview-variant')).toBe('summer-release')
    expect(url.searchParams.get('sanity-preview-pathname')).toBe(
      '/products/shoes?color=red#details',
    )
  })

  test('resolves an absolute enable route', () => {
    const url = createPreviewModeEnableUrl({
      enable: 'https://preview.example.com/enable',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/products/shoes'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.origin).toBe('https://preview.example.com')
    expect(url.searchParams.get('sanity-preview-pathname')).toBe('/products/shoes')
  })

  test('removes a variant the enable route has when no variant is selected', () => {
    const url = createPreviewModeEnableUrl({
      enable: '/api/draft-mode/enable?sanity-preview-variant=spring-release',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/products/shoes'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.searchParams.has('sanity-preview-variant')).toBe(false)
  })

  test('shows the preview page itself when the enable route is that page', () => {
    const url = createPreviewModeEnableUrl({
      enable: '/api/preview?sanity-preview-pathname=%2Flanding',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/api/preview?product=shoe&tag=new&tag=sale#details'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.pathname).toBe('/api/preview')
    expect(url.searchParams.get('product')).toBe('shoe')
    expect(url.searchParams.getAll('tag')).toEqual(['new', 'sale'])
    expect(url.hash).toBe('#details')
    expect(url.searchParams.get('sanity-preview-secret')).toBe('session-secret')
    expect(url.searchParams.get('sanity-preview-perspective')).toBe('drafts')
    expect(url.searchParams.has('sanity-preview-pathname')).toBe(false)
  })

  test('keeps the search params of an enable route that is the preview page over those of the preview', () => {
    const url = createPreviewModeEnableUrl({
      enable: '/api/preview?mode=preview',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/api/preview?mode=published&product=shoe'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.searchParams.getAll('mode')).toEqual(['preview'])
    expect(url.searchParams.get('product')).toBe('shoe')
  })

  test('does not redirect an enable route on another origin to its own pathname', () => {
    /**
     * `sanity-preview-pathname` is resolved on the origin of the enable route, so redirecting to the preview's
     * pathname would redirect to the enable route itself
     */
    const url = createPreviewModeEnableUrl({
      enable: 'https://preview.example.com/api/preview',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/api/preview?product=shoe'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.origin).toBe('https://preview.example.com')
    expect(url.searchParams.has('sanity-preview-pathname')).toBe(false)
    expect(url.searchParams.get('product')).toBe('shoe')
  })
})
