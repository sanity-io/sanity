import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {getSelectedReleaseId} from '../getSelectedReleaseId'

const release = (id: string): ReleaseDocument =>
  ({
    _id: `_.releases.${id}`,
    _type: 'system.release',
  }) as unknown as ReleaseDocument

/**
 * Documents why `useActiveReleases` must stay synchronous rather than be
 * deferred: `PerspectiveProvider` resolves `selectedReleaseId` by pairing the
 * live `selectedPerspectiveName` with the `releases` list. A deferred read
 * would let the list lag behind the selected name, and these tests show that a
 * lagging list resolves the release identity to `undefined` — the state that
 * makes reference create-in-place write a weak ref / open the wrong version.
 */
describe('getSelectedReleaseId', () => {
  it('resolves the release id when the releases list contains the selected release', () => {
    // Coherent (synchronous) list: the selected release is present.
    expect(getSelectedReleaseId('rABC' as never, [release('rABC'), release('rDEF')])).toBe('rABC')
  })

  it('returns undefined when the releases list lags behind the selected release (the deferral tear)', () => {
    // A deferred `useActiveReleases` would produce exactly this: the user has
    // selected release `rABC`, but the list hasn't caught up yet. The identity
    // resolves to undefined, which is the create-in-place `_weak` tear.
    expect(getSelectedReleaseId('rABC' as never, [])).toBeUndefined()
    expect(getSelectedReleaseId('rABC' as never, [release('rDEF')])).toBeUndefined()
  })

  it('returns undefined for system perspectives (drafts/published)', () => {
    expect(getSelectedReleaseId(undefined, [release('rABC')])).toBeUndefined()
    expect(getSelectedReleaseId('published', [release('rABC')])).toBeUndefined()
  })
})
