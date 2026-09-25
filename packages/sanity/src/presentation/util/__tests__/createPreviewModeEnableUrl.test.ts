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

  test('leaves out the page to redirect to when the enable route is the preview page', () => {
    const url = createPreviewModeEnableUrl({
      enable: '/api/preview',
      perspective: 'drafts',
      previewUrl: new URL('https://example.com/api/preview'),
      previewUrlSecret: 'session-secret',
      variant: undefined,
    })

    expect(url.toString()).toBe(
      'https://example.com/api/preview?sanity-preview-secret=session-secret&sanity-preview-perspective=drafts',
    )
  })
})
