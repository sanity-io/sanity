import {describe, expect, it} from 'vitest'

import {deriveTabTitle} from './tabTitle'

describe('deriveTabTitle', () => {
  it('returns undefined for empty queries', () => {
    expect(deriveTabTitle('')).toBeUndefined()
    expect(deriveTabTitle('   \n ')).toBeUndefined()
  })

  it('uses the filtered document type', () => {
    expect(deriveTabTitle('*[_type == "author"]{_id}')).toBe('author')
    expect(deriveTabTitle("*[_type=='post' && defined(slug)]")).toBe('post')
  })

  it('truncates a long document type like every other title', () => {
    const type = 'marketingCampaignLandingPageHeroSection'
    expect(deriveTabTitle(`*[_type == "${type}"]`)).toBe(`${type.slice(0, 31)}…`)
    expect(deriveTabTitle(`*[_type == "${type}"]`)).toHaveLength(32)
  })

  it('uses the filtered document id', () => {
    expect(deriveTabTitle('*[_id == "vista-live-test"]{_id, name}')).toBe('vista-live-test')
  })

  it('joins the types of an "in" filter', () => {
    expect(deriveTabTitle('*[_type in ["post", "author"]]')).toBe('post, author')
  })

  it('falls back to the first meaningful line, truncated', () => {
    expect(deriveTabTitle('// counting\ncount(*[defined(title)])')).toBe('count(*[defined(title)])')
    expect(deriveTabTitle(`*[references("abc")]${'x'.repeat(40)}`)).toHaveLength(32)
    expect(deriveTabTitle('{\n  "a": 1\n}')).toBe('{')
  })
})
