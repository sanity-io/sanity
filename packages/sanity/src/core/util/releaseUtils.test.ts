import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeScheduledRelease} from '../releases/__fixtures__/release.fixture'
import {isCardinalityOneRelease} from './releaseUtils'

// Type definitions for edge case testing
type ReleaseDocumentWithNullCardinality = ReleaseDocument & {
  metadata: ReleaseDocument['metadata'] & {
    cardinality: null
  }
}

type ReleaseDocumentWithoutMetadata = ReleaseDocument & {
  metadata: undefined
}

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

  it('should work as a type guard correctly', () => {
    const releaseOne: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }

    const releaseMany: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }

    if (isCardinalityOneRelease(releaseOne)) {
      expect(releaseOne.metadata.cardinality).toBe('one')
    } else {
      expect(true).toBe(false)
    }

    if (isCardinalityOneRelease(releaseMany)) {
      expect(true).toBe(false)
    } else {
      expect(releaseMany.metadata.cardinality).toBe('many')
    }
  })

  it('should work with array filter to separate cardinality types', () => {
    const releases: ReleaseDocument[] = [
      {
        ...activeScheduledRelease,
        _id: 'release1',
        metadata: {...activeScheduledRelease.metadata, cardinality: 'one'},
      },
      {
        ...activeScheduledRelease,
        _id: 'release2',
        metadata: {...activeScheduledRelease.metadata, cardinality: 'many'},
      },
      {
        ...activeScheduledRelease,
        _id: 'release3',
        metadata: {...activeScheduledRelease.metadata, cardinality: 'one'},
      },
      {
        ...activeScheduledRelease,
        _id: 'release4',
        metadata: {...activeScheduledRelease.metadata, cardinality: undefined},
      },
    ]

    const cardinalityOneReleases = releases.filter(isCardinalityOneRelease)
    const otherReleases = releases.filter((r) => !isCardinalityOneRelease(r))

    expect(cardinalityOneReleases).toHaveLength(2)
    expect(cardinalityOneReleases.map((r) => r._id)).toEqual(['release1', 'release3'])

    expect(otherReleases).toHaveLength(2)
    expect(otherReleases.map((r) => r._id)).toEqual(['release2', 'release4'])
  })

  it('should handle null cardinality gracefully', () => {
    const releaseWithNullCardinality = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: null,
      },
    } as ReleaseDocumentWithNullCardinality

    expect(isCardinalityOneRelease(releaseWithNullCardinality)).toBe(false)
  })

  it('should handle missing metadata gracefully', () => {
    const releaseWithoutMetadata = {
      ...activeScheduledRelease,
      metadata: undefined,
    } as ReleaseDocumentWithoutMetadata

    expect(() => isCardinalityOneRelease(releaseWithoutMetadata)).not.toThrow()
    expect(isCardinalityOneRelease(releaseWithoutMetadata)).toBe(false)
  })

  it('should handle releases with minimal metadata', () => {
    const releaseWithMinimalMetadata: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        title: 'Test Release',
        description: '',
        releaseType: 'asap',
        cardinality: 'one',
      },
    }

    expect(isCardinalityOneRelease(releaseWithMinimalMetadata)).toBe(true)
  })
})
