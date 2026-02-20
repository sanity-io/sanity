import {describe, expect, it} from 'vitest'

import {getMediaLibraryId} from '../VideoPreview'

describe('getMediaLibraryId', () => {
  it('extracts media library ID from a valid asset reference', () => {
    expect(getMediaLibraryId('media-library:ml123abc:video-456')).toBe('ml123abc')
  })

  it('extracts media library ID when it has complex format', () => {
    expect(getMediaLibraryId('media-library:ml_org-123:video-789')).toBe('ml_org-123')
  })

  it('throws when library ID does not start with "ml"', () => {
    expect(() => getMediaLibraryId('media-library:lib123:video-456')).toThrow(
      'Invalid asset reference',
    )
  })

  it('throws when asset reference has no colon-separated parts', () => {
    expect(() => getMediaLibraryId('some-random-string')).toThrow('Invalid asset reference')
  })

  it('throws when the second part is empty', () => {
    expect(() => getMediaLibraryId('media-library::video-456')).toThrow('Invalid asset reference')
  })

  it('throws when asset reference is empty', () => {
    expect(() => getMediaLibraryId('')).toThrow('Invalid asset reference')
  })
})
