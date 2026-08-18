import {describe, expect, it} from 'vitest'

import {getActivePerspective, getActiveVariant} from '../perspectives'
import {encodeQueryString} from './encodeQueryString'

describe('encodeQueryString', () => {
  it('encodes query, params, perspective, and variant', () => {
    const encoded = encodeQueryString(
      '*[_id == $id]',
      {id: 'book-1'},
      {perspective: ['rSummer', 'drafts'], variant: 'french'},
    )
    const params = new URLSearchParams(encoded)

    expect(params.get('query')).toBe('*[_id == $id]')
    expect(params.get('$id')).toBe('"book-1"')
    expect(params.get('perspective')).toBe('rSummer,drafts')
    expect(params.get('variant')).toBe('french')
  })

  it('omits variant when it is undefined', () => {
    const encoded = encodeQueryString('*[_type == "book"]', {}, {perspective: 'published'})
    const params = new URLSearchParams(encoded)

    expect(params.get('perspective')).toBe('published')
    expect(params.has('variant')).toBe(false)
  })

  it('builds a pinned-release query string from the navbar stack and variant', () => {
    const visionPerspective = 'pinnedRelease'
    const variant = getActiveVariant(visionPerspective, 'french')
    const encoded = encodeQueryString(
      '*[_id == $id]',
      {id: 'book-1'},
      {
        perspective:
          getActivePerspective({
            visionPerspective,
            perspectiveStack: ['published'],
          }) ?? [],
        ...(variant ? {variant} : {}),
      },
    )
    const params = new URLSearchParams(encoded)

    expect(params.get('perspective')).toBe('published')
    expect(params.get('variant')).toBe('french')
  })

  it('does not attach a navbar variant for a Vision-local perspective', () => {
    const visionPerspective = 'raw'
    const variant = getActiveVariant(visionPerspective, 'french')
    const encoded = encodeQueryString(
      '*[_type == "book"]',
      {},
      {
        perspective:
          getActivePerspective({
            visionPerspective,
            perspectiveStack: ['published'],
          }) ?? [],
        ...(variant ? {variant} : {}),
      },
    )
    const params = new URLSearchParams(encoded)

    expect(params.get('perspective')).toBe('raw')
    expect(params.has('variant')).toBe(false)
  })
})
