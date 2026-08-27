import {type SanityDocument} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {type Observable, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type TargetDocumentState} from '../../../hooks/useTargetDocumentState'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type InitialValueState} from '../../../store/document/initialValue/types'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {
  buildCreatableVariantInitialValue,
  useCreatableVariantInitialValue,
} from '../useCreatableVariantInitialValue'

const documentPreviewStoreMock = vi.hoisted(() => ({
  unstable_observeDocument: vi.fn((_id: string): Observable<SanityDocument | undefined> =>
    of(undefined),
  ),
}))

vi.mock('../../../store/datastores', () => ({
  useDocumentPreviewStore: vi.fn(() => documentPreviewStoreMock),
}))

const PUBLISHED_ID = 'article-1'
const SIBLING_ID = `versions.varscopePub.${PUBLISHED_ID}`
const DRAFT_TARGET = {id: `versions.varscopeDraft.${PUBLISHED_ID}`, scopeId: 'varscopeDraft'}

const siblingStub: VersionInfoDocumentStub = {
  _id: SIBLING_ID,
  _rev: 'rev-pub',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-02T00:00:00Z',
  _type: 'article',
  _system: {
    group: {_ref: PUBLISHED_ID, _weak: true},
    variant: {_ref: variantAlphaAudience._id, _weak: true},
    scopeId: 'varscopePub',
    draft: {_ref: DRAFT_TARGET.id, _weak: true},
  },
}

const siblingDocument = {
  _id: SIBLING_ID,
  _type: 'book',
  _rev: 'rev-pub',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-02T00:00:00Z',
  _system: {
    group: {_ref: PUBLISHED_ID, _weak: true as const},
    variant: {_ref: variantAlphaAudience._id, _weak: true as const},
    scopeId: 'varscopePub',
    draft: {_ref: DRAFT_TARGET.id, _weak: true as const},
  },
  title: 'Published variant title',
}

const creatableState: TargetDocumentState = {
  status: 'variant-missing',
  variant: variantAlphaAudience,
  bundle: 'drafts',
  siblings: {published: siblingStub, draft: undefined, version: undefined},
}

const fallback: InitialValueState = {
  loading: false,
  error: null,
  value: {_id: PUBLISHED_ID, _type: 'book', title: 'template value'},
}

describe('buildCreatableVariantInitialValue', () => {
  it('re-identifies the sibling as the draft target and rewrites _system for the draft', () => {
    const seed = buildCreatableVariantInitialValue({
      publishedSibling: siblingDocument,
      target: DRAFT_TARGET,
      variantId: variantAlphaAudience._id,
    })

    expect(seed).toEqual({
      _id: DRAFT_TARGET.id,
      _type: 'book',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-02T00:00:00Z',
      _system: {
        group: {_ref: PUBLISHED_ID, _weak: true},
        variant: {_ref: variantAlphaAudience._id, _weak: true},
        bundleId: 'drafts',
        scopeId: DRAFT_TARGET.scopeId,
      },
      title: 'Published variant title',
    })
    // The sibling's revision must not leak onto the draft-to-be.
    expect(seed).not.toHaveProperty('_rev')
  })

  it('derives the group ref from the target id when the sibling carries no _system.group', () => {
    const seed = buildCreatableVariantInitialValue({
      publishedSibling: {...siblingDocument, _system: undefined},
      target: DRAFT_TARGET,
      variantId: variantAlphaAudience._id,
    })

    expect(seed._system).toEqual({
      group: {_ref: PUBLISHED_ID, _weak: true},
      variant: {_ref: variantAlphaAudience._id, _weak: true},
      bundleId: 'drafts',
      scopeId: DRAFT_TARGET.scopeId,
    })
  })
})

describe('useCreatableVariantInitialValue', () => {
  beforeEach(() => {
    documentPreviewStoreMock.unstable_observeDocument.mockReset()
    documentPreviewStoreMock.unstable_observeDocument.mockReturnValue(of(undefined))
  })

  it('passes the fallback through untouched for non-creatable states', async () => {
    const wrapper = await createTestProvider()
    const readyState: TargetDocumentState = {
      status: 'ready',
      targetDocument: undefined,
      scopeId: undefined,
      variant: undefined,
      siblings: {published: undefined, draft: undefined, version: undefined},
    }

    const {result} = renderHook(() => useCreatableVariantInitialValue(readyState, fallback), {
      wrapper,
    })

    expect(result.current).toBe(fallback)
    expect(documentPreviewStoreMock.unstable_observeDocument).not.toHaveBeenCalled()
  })

  it('passes the fallback through for a variant-missing state without a creatable target', async () => {
    const wrapper = await createTestProvider()
    const missingState: TargetDocumentState = {
      status: 'variant-missing',
      variant: variantAlphaAudience,
      bundle: 'drafts',
      siblings: {published: siblingStub, draft: undefined, version: undefined},
    }

    const {result} = renderHook(() => useCreatableVariantInitialValue(missingState, fallback), {
      wrapper,
    })

    expect(result.current).toBe(fallback)
    expect(documentPreviewStoreMock.unstable_observeDocument).not.toHaveBeenCalled()
  })

  it('stays loading (with the draft target id) until the published sibling arrives', async () => {
    const wrapper = await createTestProvider()

    const {result} = renderHook(() => useCreatableVariantInitialValue(creatableState, fallback), {
      wrapper,
    })

    expect(result.current).toEqual({
      loading: true,
      error: null,
      value: {_id: DRAFT_TARGET.id, _type: 'book'},
    })
    expect(documentPreviewStoreMock.unstable_observeDocument).toHaveBeenCalledWith(SIBLING_ID)
  })

  it('serves the published-sibling seed once it arrives', async () => {
    const wrapper = await createTestProvider()
    documentPreviewStoreMock.unstable_observeDocument.mockReturnValue(of(siblingDocument))

    const {result} = renderHook(() => useCreatableVariantInitialValue(creatableState, fallback), {
      wrapper,
    })

    expect(result.current).toEqual({
      loading: false,
      error: null,
      value: buildCreatableVariantInitialValue({
        publishedSibling: siblingDocument,
        target: DRAFT_TARGET,
        variantId: variantAlphaAudience._id,
      }),
    })
  })
})
