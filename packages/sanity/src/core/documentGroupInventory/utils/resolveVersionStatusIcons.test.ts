import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {resolveVersionStatusIcons} from './resolveVersionStatusIcons'

const PUBLISHED_ID = 'article'

function stub(id: string, system: Partial<DocumentSystem> = {}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {group: {_ref: PUBLISHED_ID, _weak: true}, ...system},
  }
}

const draft = stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
const published = stub(PUBLISHED_ID)
const inRelease = stub(`versions.rABC.${PUBLISHED_ID}`, {
  bundleId: 'rABC',
  release: {_ref: getReleaseDocumentIdFromReleaseId('rABC'), _weak: true},
})
const variantInRelease = stub(`versions.rABC.scopeA.${PUBLISHED_ID}`, {
  bundleId: 'rABC',
  release: {_ref: getReleaseDocumentIdFromReleaseId('rABC'), _weak: true},
  variants: [{_ref: variantAlphaAudience._id, _key: 'k-123'}],
  scopeId: 'scopeA',
})

describe('resolveVersionStatusIcons', () => {
  it('marks a draft that has never been published as a draft', () => {
    expect(resolveVersionStatusIcons({document: draft, documentVersions: [draft]})).toEqual([
      'draft',
    ])
  })

  it('marks a draft of a published document as changed', () => {
    expect(
      resolveVersionStatusIcons({document: draft, documentVersions: [draft, published]}),
    ).toEqual(['draft', 'published'])
  })

  it('marks the published row as published alone, even when a draft exists', () => {
    expect(
      resolveVersionStatusIcons({document: published, documentVersions: [draft, published]}),
    ).toEqual(['published'])
  })

  it('marks a release version with its release', () => {
    expect(
      resolveVersionStatusIcons({document: inRelease, documentVersions: [published, inRelease]}),
    ).toEqual(['release'])
  })

  it('marks a variant in a release with the variant and its release', () => {
    expect(
      resolveVersionStatusIcons({
        document: variantInRelease,
        documentVersions: [inRelease, variantInRelease],
      }),
    ).toEqual(['variant', 'release'])
  })
})
