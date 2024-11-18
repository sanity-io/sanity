import {describe, expect, it} from 'vitest'

import {RELEASE_DOCUMENT_TYPE} from '../../store/constants'
import {type ReleaseDocument} from '../../store/types'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'
import {type SelectableReleasePerspective} from '../../util/perspective'
import {generateReleaseDocumentId, ReleaseDocumentId} from '../../util/releaseId'
import {getReleasesStack, sortReleases} from '../utils'

function createReleaseMock(
  value: Partial<
    Omit<ReleaseDocument, 'metadata'> & {
      metadata: Partial<ReleaseDocument['metadata']>
    }
  >,
): ReleaseDocument {
  const id = value._id || generateReleaseDocumentId()
  const name = getBundleIdFromReleaseDocumentId(id)
  return {
    _id: ReleaseDocumentId(id),
    _type: RELEASE_DOCUMENT_TYPE,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    name: getBundleIdFromReleaseDocumentId(id),
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
        _id: ReleaseDocumentId('_.releases.asap1'),
        _createdAt: '2024-10-24T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.asap2'),
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['asap2', 'asap1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(sorted[idx].name).toBe(expectedName)
    })
  })
  it('should return the scheduled releases ordered by intendedPublishAt or publishAt', () => {
    const releases: ReleaseDocument[] = [
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future2'),
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-25T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future1'),
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-23T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future4'),
        state: 'scheduled',
        publishAt: '2024-11-31T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-10-20T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future3'),
        state: 'scheduled',
        publishAt: '2024-11-26T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-22T00:00:00Z',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['future4', 'future3', 'future2', 'future1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(sorted[idx].name).toBe(expectedName)
    })
  })
  it('should return the undecided releases ordered by createdAt', () => {
    const releases: ReleaseDocument[] = [
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.undecided1'),
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.undecided2'),
        _createdAt: '2024-10-26T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['undecided2', 'undecided1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(sorted[idx].name).toBe(expectedName)
    })
  })
  it("should gracefully combine all release types, and sort them by 'undecided', 'scheduled', 'asap'", () => {
    const releases = [
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.asap2'),
        _createdAt: '2024-10-25T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.asap1'),
        _createdAt: '2024-10-24T00:00:00Z',
        metadata: {
          releaseType: 'asap',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.undecided2'),
        _createdAt: '2024-10-26T00:00:00Z',
        metadata: {
          releaseType: 'undecided',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future4'),
        state: 'scheduled',
        publishAt: '2024-11-31T00:00:00Z',
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-10-20T00:00:00Z',
        },
      }),
      createReleaseMock({
        _id: ReleaseDocumentId('_.releases.future1'),
        metadata: {
          releaseType: 'scheduled',
          intendedPublishAt: '2024-11-23T00:00:00Z',
        },
      }),
    ]
    const sorted = sortReleases(releases)
    const expectedOrder = ['undecided2', 'future4', 'future1', 'asap2', 'asap1']
    expectedOrder.forEach((expectedName, idx) => {
      expect(sorted[idx].name).toBe(expectedName)
    })
  })
})

describe('getReleasesPerspective()', () => {
  const releases = [
    createReleaseMock({
      _id: ReleaseDocumentId('_.releases.asap2'),
      _createdAt: '2024-10-25T00:00:00Z',
      metadata: {
        releaseType: 'asap',
      },
    }),
    createReleaseMock({
      _id: ReleaseDocumentId('_.releases.asap1'),
      _createdAt: '2024-10-24T00:00:00Z',
      metadata: {
        releaseType: 'asap',
      },
    }),
    createReleaseMock({
      _id: ReleaseDocumentId('_.releases.undecided2'),
      _createdAt: '2024-10-26T00:00:00Z',
      metadata: {
        releaseType: 'undecided',
      },
    }),
    createReleaseMock({
      _id: ReleaseDocumentId('_.releases.future4'),
      state: 'scheduled',
      publishAt: '2024-11-31T00:00:00Z',
      metadata: {
        releaseType: 'scheduled',
        intendedPublishAt: '2024-10-20T00:00:00Z',
      },
    }),
    createReleaseMock({
      _id: ReleaseDocumentId('_.releases.future1'),
      metadata: {
        releaseType: 'scheduled',
        intendedPublishAt: '2024-11-23T00:00:00Z',
      },
    }),
  ]
  // Define your test cases with the expected outcomes
  const testCases = [
    {perspective: 'bundle.asap1', excluded: [], expected: ['asap1', 'drafts']},
    {perspective: 'bundle.asap2', excluded: [], expected: ['asap2', 'asap1', 'drafts']},
    {
      perspective: 'bundle.undecided2',
      excluded: [],
      expected: ['undecided2', 'future4', 'future1', 'asap2', 'asap1', 'drafts'],
    },
    {
      perspective: 'bundle.undecided2',
      excluded: ['future1', 'drafts'],
      expected: ['undecided2', 'future4', 'asap2', 'asap1'] as SelectableReleasePerspective[],
    },
  ]
  it.each(testCases)(
    'should return the correct release stack for %s',
    ({perspective, excluded, expected}) => {
      const result = getReleasesStack({releases, perspective, excluded})
      expect(result).toEqual(expected)
    },
  )
})
