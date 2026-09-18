import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  activeCardinalityOneRelease,
  activeScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {
  getInventoryRowActionsContext,
  getInventoryRowVersionType,
} from './getInventoryRowActionsContext'

const PUBLISHED_ID = 'article'

function stub(id: string, system: Partial<DocumentSystem> = {}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      ...system,
    },
  }
}

function draft(): VersionInfoDocumentStub {
  return stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
}

function published(): VersionInfoDocumentStub {
  return stub(PUBLISHED_ID)
}

function releaseVersion(releaseId: string): VersionInfoDocumentStub {
  return stub(`versions.${releaseId}.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    release: {_ref: getReleaseDocumentIdFromReleaseId(releaseId), _weak: true},
  })
}

describe('getInventoryRowVersionType', () => {
  it('returns published when the document has no bundle id', () => {
    expect(getInventoryRowVersionType(published(), undefined)).toBe('published')
  })

  it('returns draft when the bundle id is drafts', () => {
    expect(getInventoryRowVersionType(draft(), undefined)).toBe('draft')
  })

  it('returns version when the release is in the full map and has many cardinality', () => {
    expect(getInventoryRowVersionType(releaseVersion('rActive'), activeScheduledRelease)).toBe(
      'version',
    )
  })

  it('returns scheduled-draft when the row release is looked up in the full map and has cardinality one', () => {
    expect(
      getInventoryRowVersionType(releaseVersion('rCardinalityOne'), activeCardinalityOneRelease),
    ).toBe('scheduled-draft')
  })

  it('returns version when the bundle id is set but the release is missing from the map', () => {
    expect(getInventoryRowVersionType(releaseVersion('rMissing'), undefined)).toBe('version')
  })
})

describe('getInventoryRowActionsContext', () => {
  it('uses the group ref as documentId and omits releaseId for published and draft', () => {
    expect(
      getInventoryRowActionsContext({
        document: published(),
        release: undefined,
        schemaType: 'article',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: PUBLISHED_ID,
      versionType: 'published',
      releaseId: undefined,
    })

    expect(
      getInventoryRowActionsContext({
        document: draft(),
        release: undefined,
        schemaType: 'article',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: PUBLISHED_ID,
      versionType: 'draft',
      releaseId: undefined,
    })
  })

  it('passes the short bundle id as releaseId for version and scheduled-draft rows', () => {
    expect(
      getInventoryRowActionsContext({
        document: releaseVersion('rActive'),
        release: activeScheduledRelease,
        schemaType: 'article',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: PUBLISHED_ID,
      versionType: 'version',
      releaseId: 'rActive',
    })

    expect(
      getInventoryRowActionsContext({
        document: releaseVersion('rCardinalityOne'),
        release: activeCardinalityOneRelease,
        schemaType: 'article',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: PUBLISHED_ID,
      versionType: 'scheduled-draft',
      releaseId: 'rCardinalityOne',
    })
  })

  it('still passes the bundle id as releaseId when the release is absent from the full map', () => {
    expect(
      getInventoryRowActionsContext({
        document: releaseVersion('rMissing'),
        release: undefined,
        schemaType: 'article',
      }),
    ).toEqual({
      schemaType: 'article',
      documentId: PUBLISHED_ID,
      versionType: 'version',
      releaseId: 'rMissing',
    })
  })
})
