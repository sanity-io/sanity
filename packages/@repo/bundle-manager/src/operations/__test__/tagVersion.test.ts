import {describe, expect, it} from 'vitest'

import {tagVersion} from '../tagVersion'

describe('tagVersion()', () => {
  it('sets a given tag to the given version', () => {
    const existingVersion = {timestamp: 1749664258097, version: '1.2.3'}

    expect(tagVersion({versions: [existingVersion]}, 'stable', '1.2.3')).toEqual({
      tags: {
        stable: '1.2.3',
      },
      versions: [existingVersion],
    })
  })

  it('throws if version is not already in the version array', () => {
    expect(() =>
      tagVersion({versions: [{timestamp: 1749664258097, version: '1.2.3'}]}, 'stable', '1.2.4'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Version "1.2.4" not known]`)
  })

  it('throws if tag is not valid', () => {
    expect(() =>
      // @ts-expect-error - testing error
      tagVersion({versions: [{timestamp: 1749664258097, version: '1.2.3'}]}, 'florp', '1.2.3'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Invalid tag "florp"]`)
  })
})
