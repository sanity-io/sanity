import {describe, expect, it} from 'vitest'

import {RELEASE_DOCUMENT_TYPE} from '../../store/constants'
import {type ReleaseDocument} from '../../store/types'
import {createReleaseId} from '../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleasesPerspective, sortReleases} from '../utils'

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
    _rev: 'rev',
    _type: RELEASE_DOCUMENT_TYPE,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    name: getReleaseIdFromReleaseDocumentId(id),
    createdBy: 'snty1',
    state: 'active',
    ...value,
    metadata: {
      title: `Release ${name}`,
      releaseType: 'asap',
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
      expect(sorted[idx].name).toBe(expectedName)
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
      expect(sorted[idx].name).toBe(expectedName)
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
      expect(sorted[idx].name).toBe(expectedName)
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
      expect(sorted[idx].name).toBe(expectedName)
    })
  })
})

describe('getReleasesPerspective()', () => {
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
  // Define your test cases with the expected outcomes
  const testCases = [
    {perspective: 'rasap1', excluded: [], expected: ['rasap1', 'drafts']},
    {perspective: 'rasap2', excluded: [], expected: ['rasap2', 'rasap1', 'drafts']},
    {
      perspective: 'rundecided2',
      excluded: [],
      expected: ['rundecided2', 'rfuture4', 'rfuture1', 'rasap2', 'rasap1', 'drafts'],
    },
    {
      perspective: 'rundecided2',
      excluded: ['rfuture1', 'drafts'],
      expected: ['rundecided2', 'rfuture4', 'rasap2', 'rasap1'],
    },
  ]
  it.each(testCases)(
    'should return the correct release stack for %s',
    ({perspective, excluded, expected}) => {
      const result = getReleasesPerspective({releases, selectedPerspective: perspective, excluded})
      expect(result).toEqual(expected)
    },
  )
})
