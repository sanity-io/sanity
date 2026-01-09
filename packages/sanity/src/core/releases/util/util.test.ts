import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {
  activeScheduledRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../__fixtures__/release.fixture'
import {
  filterReleasesForOverview,
  getDocumentIsInPerspective,
  shouldShowReleaseInView,
} from './util'

// * - document: `summer.my-document-id`, perspective: `rsummer` : **true**
// * - document: `my-document-id`, perspective: `rsummer` : **false**
// * - document: `summer.my-document-id`perspective: `rwinter` : **false**
// * - document: `summer.my-document-id`, perspective: `undefined` : **false**
// * - document: `my-document-id`, perspective: `undefined` : **true**
// * - document: `drafts.my-document-id`, perspective: `undefined` : **true**

describe('getDocumentIsInPerspective', () => {
  it('should return true if document is in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.rsummer.my-document-id', 'rsummer')).toBe(true)
  })

  it('should return false if document is not a version  document a perspective is provided', () => {
    expect(getDocumentIsInPerspective('my-document-id', 'rsummer')).toBe(false)
  })

  it('should return false if document is not in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'rwinter')).toBe(false)
  })

  it('should return false if document is a version document a no perspective is provided', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', undefined)).toBe(false)
  })

  it("should return true if the document is in the 'Published' perspective, and no perspective is provided", () => {
    expect(getDocumentIsInPerspective('my-document-id', undefined)).toBe(true)
  })
  it("should return true if the document is a draft document in the 'Published' perspective, and no perspective is provided", () => {
    expect(getDocumentIsInPerspective('drafts.my-document-id', undefined)).toBe(true)
  })

  it('should handle complex document ids correctly', () => {
    expect(
      getDocumentIsInPerspective('versions.rcomplex-summer.my-document-id', 'rcomplex-summer'),
    ).toBe(true)
  })
})

describe('shouldShowReleaseInView', () => {
  it('should show cardinality "many" releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(true)
  })

  it('should show undefined cardinality releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: undefined,
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(true)
  })

  it('should show cardinality "one" releases in "drafts" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }
    const filterFn = shouldShowReleaseInView('drafts')
    expect(filterFn(release)).toBe(true)
  })

  it('should not show cardinality "one" releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(false)
  })

  it('should not show cardinality "many" releases in "drafts" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }
    const filterFn = shouldShowReleaseInView('drafts')
    expect(filterFn(release)).toBe(false)
  })

  it('should not show undefined cardinality releases in "drafts" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: undefined,
      },
    }
    const filterFn = shouldShowReleaseInView('drafts')
    expect(filterFn(release)).toBe(false)
  })

  it('should return a function that can be used for array filtering', () => {
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
        metadata: {...activeScheduledRelease.metadata, cardinality: undefined},
      },
    ]

    const draftsFilterFn = shouldShowReleaseInView('drafts')
    const releasesFilterFn = shouldShowReleaseInView('releases')

    const draftsResult = releases.filter(draftsFilterFn)
    const releasesResult = releases.filter(releasesFilterFn)

    expect(draftsResult).toHaveLength(1)
    expect(draftsResult[0]._id).toBe('release1')

    expect(releasesResult).toHaveLength(2)
    expect(releasesResult.map((r) => r._id)).toEqual(['release2', 'release3'])
  })

  it('should handle releases with missing metadata gracefully', () => {
    const releaseWithoutMetadata = {
      ...activeScheduledRelease,
      metadata: undefined,
    } as unknown as ReleaseDocument

    const filterFn = shouldShowReleaseInView('releases')

    // Should not throw and should return false for drafts view
    expect(() => filterFn(releaseWithoutMetadata)).not.toThrow()
  })
})

describe('filterReleasesForOverview', () => {
  const scheduled: ReleaseDocument = {
    ...scheduledRelease,
    _id: '_.releases.s1',
    metadata: {...scheduledRelease.metadata, cardinality: 'one'},
  }

  const scheduling: ReleaseDocument = {
    ...scheduledRelease,
    _id: '_.releases.s1',
    state: 'scheduling',
    metadata: {...scheduledRelease.metadata, cardinality: 'one'},
  }

  const paused: ReleaseDocument = {
    ...activeScheduledRelease,
    _id: '_.releases.p1',
    metadata: {
      ...activeScheduledRelease.metadata,
      cardinality: 'one',
      releaseType: 'scheduled',
      intendedPublishAt: '2024-01-15T10:00:00Z',
    },
  }

  const many: ReleaseDocument = {
    ...activeScheduledRelease,
    _id: '_.releases.m1',
    metadata: {...activeScheduledRelease.metadata, cardinality: 'many'},
  }

  const inRange: ReleaseDocument = {
    ...scheduledRelease,
    _id: 'r1',
    publishAt: '2024-01-15T12:00:00Z',
    metadata: {...scheduledRelease.metadata, releaseType: 'scheduled'},
  }

  const outRange: ReleaseDocument = {
    ...scheduledRelease,
    _id: 'r2',
    publishAt: '2024-01-20T12:00:00Z',
  }

  const intended: ReleaseDocument = {
    ...scheduledRelease,
    _id: 'r3',
    publishAt: undefined,
    metadata: {
      ...scheduledRelease.metadata,
      releaseType: 'scheduled',
      intendedPublishAt: '2024-01-15T12:00:00Z',
    },
  }

  const scheduledWithDate: ReleaseDocument = {
    ...scheduledRelease,
    _id: '_.releases.s1',
    publishAt: '2024-01-15T12:00:00Z',
    state: 'scheduled',
    metadata: {...scheduledRelease.metadata, cardinality: 'one'},
  }

  const pausedWithDate: ReleaseDocument = {
    ...activeScheduledRelease,
    _id: '_.releases.p1',
    publishAt: '2024-01-15T12:00:00Z',
    state: 'active',
    metadata: {
      ...activeScheduledRelease.metadata,
      cardinality: 'one',
      releaseType: 'scheduled',
      intendedPublishAt: '2024-01-15T10:00:00Z',
    },
  }

  const archivedInRange: ReleaseDocument = {
    ...archivedScheduledRelease,
    publishAt: '2024-01-15T12:00:00Z',
    metadata: {...archivedScheduledRelease.metadata, releaseType: 'scheduled'},
  }

  const archivedOutRange: ReleaseDocument = {
    ...archivedScheduledRelease,
    _id: '_.releases.out',
    publishAt: '2024-01-20T12:00:00Z',
  }

  const mockDateFilter = (date: Date) => {
    const start = new Date(date)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setUTCHours(23, 59, 59, 999)
    return [start, end] as [Date, Date]
  }

  it('filters by mode for releases and drafts views', () => {
    expect(
      filterReleasesForOverview({
        releases: [many],
        archivedReleases: [archivedScheduledRelease],
        cardinalityView: 'releases',
        releaseGroupMode: 'active',
      }),
    ).toEqual([many])

    expect(
      filterReleasesForOverview({
        releases: [many],
        archivedReleases: [archivedScheduledRelease],
        cardinalityView: 'releases',
        releaseGroupMode: 'archived',
      }),
    ).toEqual([archivedScheduledRelease])

    expect(
      filterReleasesForOverview({
        releases: [scheduled, scheduling, paused],
        archivedReleases: [],
        cardinalityView: 'drafts',
        releaseGroupMode: 'active',
      }),
    ).toEqual([scheduled, scheduling])

    expect(
      filterReleasesForOverview({
        releases: [scheduled, scheduling, paused],
        archivedReleases: [],
        cardinalityView: 'drafts',
        releaseGroupMode: 'paused',
      }),
    ).toEqual([paused])
  })

  it('filters by date with intendedPublishAt fallback and archived mode', () => {
    const dateFilter = {
      filterDate: new Date('2024-01-15'),
      getTimezoneAdjustedDateTimeRange: mockDateFilter,
    }

    const activeResult = filterReleasesForOverview({
      releases: [inRange, outRange, intended],
      archivedReleases: [],
      cardinalityView: 'releases',
      releaseGroupMode: 'active',
      dateFilter,
    })

    const archivedResult = filterReleasesForOverview({
      releases: [],
      archivedReleases: [archivedInRange, archivedOutRange],
      cardinalityView: 'releases',
      releaseGroupMode: 'archived',
      dateFilter,
    })

    expect(activeResult).toHaveLength(2)
    expect(activeResult.map((r) => r._id)).toEqual(['r1', 'r3'])
    expect(archivedResult).toEqual([archivedInRange])
  })

  it('filters by date combined with state filters for drafts', () => {
    const dateFilter = {
      filterDate: new Date('2024-01-15'),
      getTimezoneAdjustedDateTimeRange: mockDateFilter,
    }

    const activeResult = filterReleasesForOverview({
      releases: [scheduledWithDate, pausedWithDate],
      archivedReleases: [],
      cardinalityView: 'drafts',
      releaseGroupMode: 'active',
      dateFilter,
    })

    const pausedResult = filterReleasesForOverview({
      releases: [scheduledWithDate, pausedWithDate],
      archivedReleases: [],
      cardinalityView: 'drafts',
      releaseGroupMode: 'paused',
      dateFilter,
    })

    expect(activeResult).toEqual([scheduledWithDate])
    expect(pausedResult).toEqual([pausedWithDate])
  })
})
