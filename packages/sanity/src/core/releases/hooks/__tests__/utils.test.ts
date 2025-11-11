import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type ReleaseId} from '../../../perspective/types'
import {RELEASE_DOCUMENT_TYPE} from '../../store/constants'
import {createReleaseId} from '../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleasesPerspectiveStack, sortReleases} from '../utils'

function createReleaseMock(
  value: Partial<
    Omit<ReleaseDocument, 'metadata'> & {
      metadata: Partial<ReleaseDocument['metadata']>
    }
  >,
): ReleaseDocument {
  const id = value._id || createReleaseId()
  const name = getReleaseIdFromReleaseDocumentId(id)
  return {
    _id: id,
    name: getReleaseIdFromReleaseDocumentId(id),
    _rev: 'rev',
    _type: RELEASE_DOCUMENT_TYPE,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    state: 'active',
    ...value,
    metadata: {
      title: `Release ${name}`,
      releaseType: 'asap',
      cardinality: 'many',
      ...value.metadata,
    },
  }
}
describe('sortReleases()', () => {
  it('should return the asap releases ordered by createdAt', () => {
    const releases: ReleaseDocument[] = [
      createReleaseMock({
        _id: '_.releases.rasap1',
        _createdAt: '2024-10-24T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rasap2',
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['rasap2', 'rasap1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(getReleaseIdFromReleaseDocumentId(sorted[idx]._id)).toBe(expectedName)
    })
  })
  it('should return the scheduled releases ordered by intendedPublishAt or publishAt', () => {
    const releases: ReleaseDocument[] = [
      createReleaseMock({
        _id: '_.releases.rfuture2',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-25T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rfuture1',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-23T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rfuture4',
        state: 'scheduled',
        publishAt: '2024-11-31T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-10-20T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rfuture3',
        state: 'scheduled',
        publishAt: '2024-11-26T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-22T00:00:00Z',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['rfuture4', 'rfuture3', 'rfuture2', 'rfuture1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(getReleaseIdFromReleaseDocumentId(sorted[idx]._id)).toBe(expectedName)
    })
  })
  it('should return the undecided releases ordered by createdAt', () => {
    const releases: ReleaseDocument[] = [
      createReleaseMock({
        _id: '_.releases.rundecided1',
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rundecided2',
        _createdAt: '2024-10-26T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['rundecided2', 'rundecided1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(getReleaseIdFromReleaseDocumentId(sorted[idx]._id)).toBe(expectedName)
    })
  })
  it("should gracefully combine all release types, and sort them by 'undecided', 'scheduled', 'asap'", () => {
    const releases = [
      createReleaseMock({
        _id: '_.releases.rasap2',
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rasap1',
        _createdAt: '2024-10-24T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rundecided2',
        _createdAt: '2024-10-26T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rfuture4',
        state: 'scheduled',
        publishAt: '2024-11-31T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-10-20T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: '_.releases.rfuture1',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-23T00:00:00Z',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['rundecided2', 'rfuture4', 'rfuture1', 'rasap2', 'rasap1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(getReleaseIdFromReleaseDocumentId(sorted[idx]._id)).toBe(expectedName)
    })
  })
})

describe('getReleasesPerspectiveStack()', () => {
  const releases = [
    createReleaseMock({
      _id: '_.releases.rasap2',
      _createdAt: '2024-10-25T00:00:00Z',
      metadata: {
        releaseType: 'asap',
      },
    }),
    createReleaseMock({
      _id: '_.releases.rasap1',
      _createdAt: '2024-10-24T00:00:00Z',
      metadata: {
        releaseType: 'asap',
      },
    }),
    createReleaseMock({
      _id: '_.releases.rundecided2',
      _createdAt: '2024-10-26T00:00:00Z',
      metadata: {
        releaseType: 'undecided',
      },
    }),
    createReleaseMock({
      _id: '_.releases.rfuture4',
      state: 'scheduled',
      publishAt: '2024-11-31T00:00:00Z',
      metadata: {
        releaseType: 'scheduled',
        intendedPublishAt: '2024-10-20T00:00:00Z',
      },
    }),
    createReleaseMock({
      _id: '_.releases.rfuture1',
      metadata: {
        releaseType: 'scheduled',
        intendedPublishAt: '2024-11-23T00:00:00Z',
      },
    }),
    // Add cardinality one releases for testing
    createReleaseMock({
      _id: '_.releases.rcardinalityOne1',
      _createdAt: '2024-10-27T00:00:00Z',
      metadata: {
        releaseType: 'asap',
        cardinality: 'one',
      },
    }),
    createReleaseMock({
      _id: '_.releases.rcardinalityOne2',
      _createdAt: '2024-10-28T00:00:00Z',
      metadata: {
        releaseType: 'scheduled',
        cardinality: 'one',
        intendedPublishAt: '2024-11-30T00:00:00Z',
      },
    }),
  ]
  // Define your test cases with the expected outcomes
  const testCases: {
    selectedPerspectiveName: ReleaseId | 'published' | undefined
    excludedPerspectives: string[]
    isDraftModelEnabled: boolean
    expected: string[]
  }[] = [
    {
      selectedPerspectiveName: 'rasap1',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['rasap1', 'drafts'],
    },
    {
      selectedPerspectiveName: 'rasap1',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: ['rasap1', 'published'],
    },
    {
      selectedPerspectiveName: 'rasap2',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['rasap2', 'rasap1', 'drafts'],
    },
    {
      selectedPerspectiveName: 'rasap2',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: ['rasap2', 'rasap1', 'published'],
    },
    {
      selectedPerspectiveName: 'rundecided2',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: [
        'rundecided2',
        'rfuture4',
        'rcardinalityOne2',
        'rfuture1',
        'rcardinalityOne1',
        'rasap2',
        'rasap1',
        'drafts',
      ],
    },
    {
      selectedPerspectiveName: 'rundecided2',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: [
        'rundecided2',
        'rfuture4',
        'rcardinalityOne2',
        'rfuture1',
        'rcardinalityOne1',
        'rasap2',
        'rasap1',
        'published',
      ],
    },
    {
      selectedPerspectiveName: 'rundecided2',
      isDraftModelEnabled: true,
      excludedPerspectives: ['rfuture1', 'drafts'],
      expected: [
        'rundecided2',
        'rfuture4',
        'rcardinalityOne2',
        'rcardinalityOne1',
        'rasap2',
        'rasap1',
      ],
    },
    {
      selectedPerspectiveName: 'rundecided2',
      isDraftModelEnabled: false,
      excludedPerspectives: ['rfuture1', 'published'],
      expected: [
        'rundecided2',
        'rfuture4',
        'rcardinalityOne2',
        'rcardinalityOne1',
        'rasap2',
        'rasap1',
      ],
    },
    {
      selectedPerspectiveName: 'published',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['published'],
    },
    {
      selectedPerspectiveName: 'published',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: ['published'],
    },
    {
      selectedPerspectiveName: undefined,
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['drafts'],
    },
    {
      selectedPerspectiveName: undefined,
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: ['published'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne1',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['rcardinalityOne1', 'rasap2', 'rasap1', 'drafts'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne1',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: ['rcardinalityOne1', 'rasap2', 'rasap1', 'published'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne2',
      isDraftModelEnabled: true,
      excludedPerspectives: [],
      expected: ['rcardinalityOne2', 'rfuture1', 'rcardinalityOne1', 'rasap2', 'rasap1', 'drafts'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne2',
      isDraftModelEnabled: false,
      excludedPerspectives: [],
      expected: [
        'rcardinalityOne2',
        'rfuture1',
        'rcardinalityOne1',
        'rasap2',
        'rasap1',
        'published',
      ],
    },
    // Test cardinality one with excluded perspectives
    {
      selectedPerspectiveName: 'rcardinalityOne1',
      isDraftModelEnabled: true,
      excludedPerspectives: ['rcardinalityOne1'],
      expected: ['rasap2', 'rasap1', 'drafts'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne2',
      isDraftModelEnabled: false,
      excludedPerspectives: ['rcardinalityOne2'],
      expected: ['rfuture1', 'rcardinalityOne1', 'rasap2', 'rasap1', 'published'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne1',
      isDraftModelEnabled: true,
      excludedPerspectives: ['drafts'],
      expected: ['rcardinalityOne1', 'rasap2', 'rasap1'],
    },
    {
      selectedPerspectiveName: 'rcardinalityOne2',
      isDraftModelEnabled: false,
      excludedPerspectives: ['published'],
      expected: ['rcardinalityOne2', 'rfuture1', 'rcardinalityOne1', 'rasap2', 'rasap1'],
    },
  ]
  it.each(testCases)(
    'should return the correct release stack for %s',
    ({selectedPerspectiveName, isDraftModelEnabled, excludedPerspectives, expected}) => {
      const result = getReleasesPerspectiveStack({
        releases,
        selectedPerspectiveName,
        excludedPerspectives,
        isDraftModelEnabled,
      })
      expect(result).toEqual(expected)
    },
  )
})
