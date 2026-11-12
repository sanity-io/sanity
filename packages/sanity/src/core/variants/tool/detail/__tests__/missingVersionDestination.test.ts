import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../../releases/__fixtures__/release.fixture'
import {getMissingVersionDestination} from '../missingVersionDestination'

describe('getMissingVersionDestination', () => {
  it('creates in a selected release that can take changes', () => {
    for (const release of [activeASAPRelease, activeScheduledRelease]) {
      expect(getMissingVersionDestination({selectedPerspective: release, liveEdit: false})).toEqual(
        {kind: 'release', release, perspective: release},
      )
    }
  })

  it('keeps a selected active release for live-edit types too', () => {
    expect(
      getMissingVersionDestination({selectedPerspective: activeASAPRelease, liveEdit: true}).kind,
    ).toBe('release')
  })

  it('creates in Drafts without a selected release, or Published for live-edit types', () => {
    for (const selectedPerspective of [undefined, 'drafts', 'published']) {
      expect(getMissingVersionDestination({selectedPerspective, liveEdit: false})).toEqual({
        kind: 'drafts',
        perspective: 'drafts',
      })
    }
    expect(getMissingVersionDestination({selectedPerspective: 'drafts', liveEdit: true})).toEqual({
      kind: 'published',
      perspective: 'published',
    })
  })

  it('falls back to Drafts when the selected release is scheduled, and says why', () => {
    expect(
      getMissingVersionDestination({selectedPerspective: scheduledRelease, liveEdit: false}),
    ).toEqual({
      kind: 'drafts',
      perspective: 'drafts',
      fallback: {release: scheduledRelease, reason: 'scheduled'},
    })
  })

  it('falls back when the selected release is archived or published', () => {
    for (const release of [archivedScheduledRelease, publishedASAPRelease]) {
      expect(getMissingVersionDestination({selectedPerspective: release, liveEdit: true})).toEqual({
        kind: 'published',
        perspective: 'published',
        fallback: {release, reason: 'locked'},
      })
    }
  })
})
