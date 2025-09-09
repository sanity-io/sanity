import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeScheduledRelease} from '../releases/__fixtures__/release.fixture'
import {isCardinalityOneRelease} from './releaseUtils'

describe('isCardinalityOneRelease', () => {
  it('should return true for cardinality "one" releases', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }
    expect(isCardinalityOneRelease(release)).toBe(true)
  })

  it('should return false for cardinality "many" releases', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }
    expect(isCardinalityOneRelease(release)).toBe(false)
  })

  it('should return false for undefined cardinality releases', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: undefined,
      },
    }
    expect(isCardinalityOneRelease(release)).toBe(false)
  })
})
