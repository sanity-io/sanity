import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../store/types'
import {getDocumentVersionInfoFromVersions} from '../getDocumentVersionInfoFromVersions'

const publishedId = 'article-123'

const publishedVersion: VersionInfoDocumentStub = {
  _id: publishedId,
  _rev: 'published-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
  _system: {
    bundleId: null,
    release: null,
    variant: null,
    group: {_ref: publishedId, _weak: true},
    scopeId: null,
  },
}

const draftVersion: VersionInfoDocumentStub = {
  _id: 'drafts.article-123',
  _rev: 'draft-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-03T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: null,
    group: {_ref: publishedId, _weak: true},
    scopeId: null,
  },
}

const releaseVersion: VersionInfoDocumentStub = {
  _id: 'versions.release1.article-123',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-04T00:00:00Z',
  _system: {
    bundleId: 'release1',
    release: {_ref: '_.releases.release1', _weak: true},
    variant: null,
    group: {_ref: publishedId, _weak: true},
    scopeId: 'release1',
  },
}

const variantVersion: VersionInfoDocumentStub = {
  _id: 'versions.scope1.article-123',
  _rev: 'variant-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-05T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    release: null,
    variant: {_ref: '_.variants.test', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'scope1',
  },
}

describe('getDocumentVersionInfoFromVersions', () => {
  it('returns empty result for empty input', () => {
    expect(getDocumentVersionInfoFromVersions([])).toEqual({
      draft: undefined,
      published: undefined,
      versions: {},
    })
  })

  it('maps published, draft, and release versions from _system metadata', () => {
    expect(
      getDocumentVersionInfoFromVersions([publishedVersion, draftVersion, releaseVersion]),
    ).toEqual({
      draft: draftVersion,
      published: publishedVersion,
      versions: {
        release1: releaseVersion,
      },
    })
  })

  it('excludes variant documents from all fields', () => {
    expect(
      getDocumentVersionInfoFromVersions([
        publishedVersion,
        draftVersion,
        releaseVersion,
        variantVersion,
      ]),
    ).toEqual({
      draft: draftVersion,
      published: publishedVersion,
      versions: {
        release1: releaseVersion,
      },
    })
  })

  it('throws when versions belong to different document groups', () => {
    const otherPublishedVersion: VersionInfoDocumentStub = {
      ...publishedVersion,
      _id: 'other-article',
      _system: {
        bundleId: null,
        release: null,
        variant: null,
        group: {_ref: 'other-article', _weak: true},
        scopeId: null,
      },
    }

    expect(() =>
      getDocumentVersionInfoFromVersions([
        publishedVersion,
        draftVersion,
        releaseVersion,
        otherPublishedVersion,
      ]),
    ).toThrow('Some versions are not in the same group, this is not supported')
  })

  it('treats versions without _rev as non-existent', () => {
    const missingRevVersion: VersionInfoDocumentStub = {
      ...draftVersion,
      _rev: '',
    }

    expect(getDocumentVersionInfoFromVersions([missingRevVersion])).toEqual({
      draft: undefined,
      published: undefined,
      versions: {},
    })
  })

  it('omits release versions without _rev from the record', () => {
    const missingRevReleaseVersion: VersionInfoDocumentStub = {
      ...releaseVersion,
      _rev: '',
    }

    expect(getDocumentVersionInfoFromVersions([missingRevReleaseVersion])).toEqual({
      draft: undefined,
      published: undefined,
      versions: {
        release1: undefined,
      },
    })
  })
})
