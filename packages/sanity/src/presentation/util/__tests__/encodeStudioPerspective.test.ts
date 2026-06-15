import {describe, expect, it} from 'vitest'

import {encodeStudioPerspective} from '../encodeStudioPerspective'

describe('encodeStudioPerspective', () => {
  it('returns "drafts" for the drafts perspective', () => {
    expect(encodeStudioPerspective('drafts')).toBe('drafts')
  })

  it('returns "published" for the published perspective', () => {
    expect(encodeStudioPerspective('published')).toBe('published')
  })

  it('joins an array perspective with commas (release perspective stack)', () => {
    expect(encodeStudioPerspective(['rABC123', 'drafts'])).toBe('rABC123,drafts')
  })

  it('handles a single-element array perspective', () => {
    expect(encodeStudioPerspective(['published'])).toBe('published')
  })

  it('handles a full release perspective stack', () => {
    expect(encodeStudioPerspective(['rRelease1', 'rRelease2', 'drafts'])).toBe(
      'rRelease1,rRelease2,drafts',
    )
  })
})
