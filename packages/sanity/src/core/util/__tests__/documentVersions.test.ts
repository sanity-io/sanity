import {type DocumentVersionKind} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {isReleaseVersionAllowed, isVariantVersionAllowed} from '../documentVersions'

describe('documentVersions', () => {
  test.each<[DocumentVersionKind[] | undefined, boolean, boolean]>([
    [undefined, true, true],
    [['releases', 'variants'], true, true],
    [['releases'], true, false],
    [['variants'], false, true],
    [[], false, false],
  ])('`versions: %j` allows releases: %s, variants: %s', (versions, releases, variants) => {
    expect(isReleaseVersionAllowed({versions})).toBe(releases)
    expect(isVariantVersionAllowed({versions})).toBe(variants)
  })

  test('allows both when the schema type is unknown', () => {
    expect(isReleaseVersionAllowed(undefined)).toBe(true)
    expect(isVariantVersionAllowed(undefined)).toBe(true)
  })
})
