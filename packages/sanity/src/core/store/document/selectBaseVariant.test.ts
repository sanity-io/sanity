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

/**
 * The base variant is the checked out document that has the provided base
 * variant id and is not itself a variant.
 */
describe('selectBaseVariant', () => {
  describe('the base variant is the checked out document with the provided base variant id', () => {
    const published = createDocument('article-1')
    const draft = createDocument('drafts.article-1')
    const version = createDocument('versions.rABC.article-1')

    // All three are checked out at once, so only the id can decide which is selected.
    const editState = createEditState({published, draft, version})

    it.each([
      {slot: 'published', document: published},
      {slot: 'draft', document: draft},
      {slot: 'version', document: version},
    ])('selects the $slot document when its id is the base variant id', ({document}) => {
      expect(selectBaseVariant(editState, document._id)).toBe(document)
    })

    it('compares ids verbatim, without interpreting the bundle they name', () => {
      const anonymousBundleVersion = createDocument('versions.agent-run-1.article-1')

      expect(
        selectBaseVariant(
          createEditState({version: anonymousBundleVersion}),
          'versions.agent-run-1.article-1',
        ),
      ).toBe(anonymousBundleVersion)
    })

    it('returns null when no base variant id is provided', () => {
      expect(selectBaseVariant(editState, undefined)).toBeNull()
    })

    it('returns null when no checked out document has the base variant id', () => {
      expect(
        selectBaseVariant(
          createEditState({published: createDocument('article-1')}),
          'drafts.article-1',
        ),
      ).toBeNull()
    })

    it('returns null when the edit state has not checked out any document yet', () => {
      expect(selectBaseVariant(createEditState(), 'drafts.article-1')).toBeNull()
    })
  })

  describe('the base variant is never a document that is itself a variant', () => {
    const baseVariantId = 'versions.opaquescope.article-1'

    it('returns null when the document with the base variant id has a variant reference', () => {
      const variant = createDocument(baseVariantId, {
        variant: {_ref: 'system.variant.nynorsk', _weak: true},
      })

      expect(selectBaseVariant(createEditState({version: variant}), baseVariantId)).toBeNull()
    })

    it('selects the document with the base variant id when it has no variant reference', () => {
      // Same id as above: the variant reference disqualifies a document, not the shape of its id.
      const baseVariant = createDocument(baseVariantId, {scopeId: 'opaquescope'})

      expect(selectBaseVariant(createEditState({version: baseVariant}), baseVariantId)).toBe(
        baseVariant,
      )
    })
  })
})
