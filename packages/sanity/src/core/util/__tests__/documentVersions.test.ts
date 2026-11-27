import {type DocumentVersionKind} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {
  isReleaseVersionAllowed,
  isScheduledDraftVersionAllowed,
  isVariantVersionAllowed,
} from '../documentVersions'

describe('documentVersions', () => {
  test.each<[DocumentVersionKind[] | undefined, boolean, boolean, boolean]>([
    [undefined, true, true, true],
    [['releases', 'scheduled-drafts', 'variants'], true, true, true],
    [['releases'], true, false, false],
    [['scheduled-drafts'], false, true, false],
    [['variants'], false, false, true],
    [['releases', 'variants'], true, false, true],
    [[], false, false, false],
  ])(
    '`versions: %j` allows releases: %s, scheduled drafts: %s, variants: %s',
    (versions, releases, scheduledDrafts, variants) => {
      expect(isReleaseVersionAllowed({versions})).toBe(releases)
      expect(isScheduledDraftVersionAllowed({versions})).toBe(scheduledDrafts)
      expect(isVariantVersionAllowed({versions})).toBe(variants)
    },
  )

  test('allows every kind when the schema type is unknown', () => {
    expect(isReleaseVersionAllowed(undefined)).toBe(true)
    expect(isScheduledDraftVersionAllowed(undefined)).toBe(true)
    expect(isVariantVersionAllowed(undefined)).toBe(true)
  })
})
