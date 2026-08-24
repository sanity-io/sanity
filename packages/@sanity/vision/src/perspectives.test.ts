import {describe, expect, it} from 'vitest'

import {getActivePerspective, getActiveVariant} from './perspectives'

describe('getActivePerspective', () => {
  it('returns the studio perspective stack for pinnedRelease', () => {
    expect(
      getActivePerspective({
        visionPerspective: 'pinnedRelease',
        perspectiveStack: ['rSummer', 'drafts'],
      }),
    ).toEqual(['rSummer', 'drafts'])
  })

  it('returns the scheduled drafts stack for scheduledDrafts', () => {
    expect(
      getActivePerspective({
        visionPerspective: 'scheduledDrafts',
        perspectiveStack: ['drafts'],
        scheduledDraftsStack: ['rDraft', 'drafts'],
      }),
    ).toEqual(['rDraft', 'drafts'])
  })

  it('returns named perspectives as-is', () => {
    expect(
      getActivePerspective({
        visionPerspective: 'published',
        perspectiveStack: ['rSummer', 'drafts'],
      }),
    ).toBe('published')
  })
})

describe('getActiveVariant', () => {
  it('returns the navbar variant id when the vision perspective is pinnedRelease', () => {
    expect(getActiveVariant('pinnedRelease', 'french')).toBe('french')
  })

  it('returns undefined when pinnedRelease has no selected variant', () => {
    expect(getActiveVariant('pinnedRelease', undefined)).toBeUndefined()
  })

  it('does not attach a variant for other vision perspectives', () => {
    expect(getActiveVariant('raw', 'french')).toBeUndefined()
    expect(getActiveVariant('published', 'french')).toBeUndefined()
    expect(getActiveVariant('drafts', 'french')).toBeUndefined()
    expect(getActiveVariant('scheduledDrafts', 'french')).toBeUndefined()
    expect(getActiveVariant(undefined, 'french')).toBeUndefined()
  })
})
