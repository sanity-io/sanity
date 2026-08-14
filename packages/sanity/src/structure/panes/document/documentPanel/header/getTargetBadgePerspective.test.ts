import {
  type SystemVariant,
  type TargetDocumentState,
  type TargetPerspective,
  type VersionInfoDocumentStub,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  getBadgeSystemDocument,
  getTargetBadgePerspective,
  isTargetBadgeMissing,
} from './getTargetBadgePerspective'

const groupRef = {_ref: 'doc-1', _weak: true as const}
const variantRef = {_ref: '_.variants.alpha-audience', _weak: true as const}

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  ...stub,
})

const publishedDocument = versionStub({
  _id: 'doc-1',
  _system: {group: groupRef},
})

const draftDocument = versionStub({
  _id: 'drafts.doc-1',
  _system: {bundleId: 'drafts', group: groupRef},
})

const publishedVariant = versionStub({
  _id: 'versions.varscope.doc-1',
  _system: {
    variant: variantRef,
    group: groupRef,
    scopeId: 'varscope',
  },
})

const draftVariant = versionStub({
  _id: 'versions.varscopeDraft.doc-1',
  _system: {
    bundleId: 'drafts',
    variant: variantRef,
    group: groupRef,
    scopeId: 'varscopeDraft',
  },
})

const variantAlphaAudience = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'rev-alpha',
  conditions: {audience: 'alpha'},
  priority: 0,
  metadata: {title: 'Alpha audience', description: []},
} as SystemVariant

const releasePerspective = {
  _id: '_.releases.rSummer',
  _type: 'system.release',
  _rev: 'r1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  name: 'rSummer',
  state: 'active',
  metadata: {title: 'Summer', releaseType: 'asap'},
} as TargetPerspective

const readyState = (
  targetDocument: VersionInfoDocumentStub | undefined,
): Extract<TargetDocumentState, {status: 'ready'}> => ({
  status: 'ready',
  targetDocument,
  scopeId: targetDocument?._system.scopeId,
  variant: undefined,
  publishedSibling: undefined,
})

const variantMissingState = (
  publishedSibling: VersionInfoDocumentStub | undefined,
): Extract<TargetDocumentState, {status: 'variant-missing'}> => ({
  status: 'variant-missing',
  variant: variantAlphaAudience,
  bundle: 'drafts',
  publishedSibling,
})

describe('getTargetBadgePerspective', () => {
  it('mirrors the selected perspective for non-live-edit documents', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: false,
        selectedPerspective: 'drafts',
        document: publishedDocument,
      }),
    ).toBe('drafts')

    expect(
      getTargetBadgePerspective({
        isLiveEdit: false,
        selectedPerspective: 'published',
        document: publishedDocument,
      }),
    ).toBe('published')
  })

  it('shows published for live-edit documents with no bundleId while drafts is selected', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: 'drafts',
        document: publishedDocument,
      }),
    ).toBe('published')
  })

  it('shows drafts for live-edit documents whose _system.bundleId is drafts', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: 'drafts',
        document: draftDocument,
      }),
    ).toBe('drafts')
  })

  it('treats a live-edit document with no _system as published', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: 'drafts',
        document: {},
      }),
    ).toBe('published')
  })

  it('does not override a selected release perspective', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: releasePerspective,
        document: publishedDocument,
      }),
    ).toBe(releasePerspective)
  })

  it('classifies a published live-edit variant as published', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: 'drafts',
        document: publishedVariant,
      }),
    ).toBe('published')
  })

  it('classifies a draft live-edit variant as drafts', () => {
    expect(
      getTargetBadgePerspective({
        isLiveEdit: true,
        selectedPerspective: 'drafts',
        document: draftVariant,
      }),
    ).toBe('drafts')
  })
})

describe('getBadgeSystemDocument', () => {
  it('prefers the ready target document', () => {
    expect(getBadgeSystemDocument(readyState(draftDocument), publishedDocument)).toBe(draftDocument)
  })

  it('uses the published sibling when the variant is missing', () => {
    expect(getBadgeSystemDocument(variantMissingState(publishedVariant), publishedDocument)).toBe(
      publishedVariant,
    )
  })

  it('falls back to the displayed document', () => {
    expect(getBadgeSystemDocument(readyState(undefined), publishedDocument)).toBe(publishedDocument)
  })
})

describe('isTargetBadgeMissing', () => {
  it('does not dim live-edit variant-missing when a published sibling exists', () => {
    expect(
      isTargetBadgeMissing({
        isLiveEdit: true,
        bundle: 'drafts',
        state: variantMissingState(publishedVariant),
      }),
    ).toBe(false)
  })

  it('dims variant-missing for non-live-edit documents', () => {
    expect(
      isTargetBadgeMissing({
        isLiveEdit: false,
        bundle: 'drafts',
        state: variantMissingState(publishedVariant),
      }),
    ).toBe(true)
  })

  it('does not dim a ready live-edit document in a system bundle with no target', () => {
    expect(
      isTargetBadgeMissing({
        isLiveEdit: true,
        bundle: 'drafts',
        state: readyState(undefined),
      }),
    ).toBe(false)
  })
})
