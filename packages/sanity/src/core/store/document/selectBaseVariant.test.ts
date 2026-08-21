import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type EditStateFor} from './document-pair/editState'
import {selectBaseVariant} from './selectBaseVariant'

function createDocument(_id: string, _system?: SanityDocument['_system']): SanityDocument {
  return {
    _id,
    _type: 'article',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
    _rev: 'rev',
    ...(_system ? {_system} : {}),
  }
}

function createEditState(documents: Partial<EditStateFor> = {}): EditStateFor {
  return {
    id: 'article-1',
    type: 'article',
    transactionSyncLock: null,
    draft: null,
    published: null,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
    ...documents,
  }
}

describe('selectBaseVariant', () => {
  it('selects the published document when the base variant is the published document', () => {
    const published = createDocument('article-1')

    expect(
      selectBaseVariant(
        createEditState({published, draft: createDocument('drafts.article-1')}),
        'article-1',
      ),
    ).toBe(published)
  })

  it('selects the draft document when the base variant is the draft document', () => {
    const draft = createDocument('drafts.article-1')

    expect(
      selectBaseVariant(
        createEditState({draft, published: createDocument('article-1')}),
        'drafts.article-1',
      ),
    ).toBe(draft)
  })

  it('selects the version document when the base variant belongs to a release', () => {
    const version = createDocument('versions.rABC.article-1')

    expect(
      selectBaseVariant(
        createEditState({version, published: createDocument('article-1')}),
        'versions.rABC.article-1',
      ),
    ).toBe(version)
  })

  it('selects the version document when the base variant belongs to an anonymous bundle', () => {
    const version = createDocument('versions.agent-run-1.article-1')

    expect(selectBaseVariant(createEditState({version}), 'versions.agent-run-1.article-1')).toBe(
      version,
    )
  })

  it('returns null when there is no base variant to compare against', () => {
    expect(
      selectBaseVariant(createEditState({draft: createDocument('drafts.article-1')}), undefined),
    ).toBeNull()
  })

  it('returns null when the pair has not loaded the base variant yet', () => {
    // A version stub can resolve before its pair does, so an absent document is transient rather
    // than a statement that no base variant exists.
    expect(selectBaseVariant(createEditState(), 'drafts.article-1')).toBeNull()
  })

  it('does not select a document belonging to a different bundle', () => {
    // The published document is checked out alongside the draft, but only the draft is the base
    // variant for the drafts bundle.
    expect(
      selectBaseVariant(
        createEditState({published: createDocument('article-1')}),
        'drafts.article-1',
      ),
    ).toBeNull()
  })

  it('returns null when the resolved document belongs to a variant definition', () => {
    // The base variant is defined by the absence of `_system.variant`. Enforced here rather than
    // inferred from the shape of the document id.
    const variant = createDocument('versions.opaquescope.article-1', {
      variant: {_ref: 'system.variant.nynorsk', _weak: true},
    })

    expect(
      selectBaseVariant(createEditState({version: variant}), 'versions.opaquescope.article-1'),
    ).toBeNull()
  })
})
