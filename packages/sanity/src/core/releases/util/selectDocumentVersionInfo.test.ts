import {describe, expect, it} from 'vitest'

import {type DocumentPerspectiveState} from '../hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../store/types'
import {selectDocumentVersionInfo} from './selectDocumentVersionInfo'

const publishedStub: VersionInfoDocumentStub = {
  _id: 'doc-1',
  _rev: 'published-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
}

const draftStub: VersionInfoDocumentStub = {
  _id: 'drafts.doc-1',
  _rev: 'draft-rev',
  _createdAt: '2024-01-03T00:00:00Z',
  _updatedAt: '2024-01-04T00:00:00Z',
}

const releaseStub: VersionInfoDocumentStub = {
  _id: 'versions.rASAP.doc-1',
  _rev: 'release-rev',
  _createdAt: '2024-01-05T00:00:00Z',
  _updatedAt: '2024-01-06T00:00:00Z',
}

describe('selectDocumentVersionInfo', () => {
  it('returns loading state while versions are loading', () => {
    expect(
      selectDocumentVersionInfo('doc-1', {
        versions: [],
        loading: true,
      }),
    ).toEqual({
      isLoading: true,
      draft: undefined,
      published: undefined,
      versions: {},
    })
  })

  it('partitions draft, published, and release versions', () => {
    const state: Pick<DocumentPerspectiveState, 'versions' | 'loading'> = {
      loading: false,
      versions: [publishedStub, draftStub, releaseStub],
    }

    expect(selectDocumentVersionInfo('doc-1', state)).toEqual({
      isLoading: false,
      draft: draftStub,
      published: publishedStub,
      versions: {
        rASAP: releaseStub,
      },
    })
  })

  it('ignores versions without _rev', () => {
    const state: Pick<DocumentPerspectiveState, 'versions' | 'loading'> = {
      loading: false,
      versions: [
        publishedStub,
        {
          _id: 'drafts.doc-1',
          _rev: '',
          _createdAt: '',
          _updatedAt: '',
        },
      ],
    }

    expect(selectDocumentVersionInfo('doc-1', state)).toEqual({
      isLoading: false,
      draft: undefined,
      published: publishedStub,
      versions: {},
    })
  })
})
