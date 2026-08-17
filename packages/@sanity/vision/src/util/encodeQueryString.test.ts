import {describe, expect, it} from 'vitest'

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
})
