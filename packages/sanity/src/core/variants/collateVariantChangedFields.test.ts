import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type EditStateFor} from '../store/document/document-pair/editState'
import {collateVariantChangedFields, selectVariantBaseDocument} from './collateVariantChangedFields'

const schemaType = {
  name: 'article',
  jsonType: 'object',
  fields: [
    {name: 'title'},
    {name: 'body'},
    {name: 'tags'},
    // Present on the schema so the filter has something to exclude, which a real schema would not
    // declare — the exclusion is defensive.
    {name: '_rev'},
  ],
} as unknown as ObjectSchemaType

function doc(fields: Record<string, unknown>): SanityDocument {
  return {
    _id: 'article-1',
    _type: 'article',
    _rev: 'rev',
    _createdAt: '2026-08-12T09:00:00Z',
    _updatedAt: '2026-08-12T09:00:00Z',
    ...fields,
  } as SanityDocument
}

function names(changedFields: ReadonlySet<string>): string[] {
  return [...changedFields].sort()
}

describe('collateVariantChangedFields', () => {
  it('marks nothing when there is no variant document', () => {
    // The form is showing the create-variant affordance, so marking every field would be noise.
    const changedFields = collateVariantChangedFields({
      variantDocument: null,
      baseDocument: doc({title: 'Base', body: 'Base body'}),
      schemaType,
    })

    expect(names(changedFields)).toEqual([])
  })

  it('marks only the fields whose value differs from the base', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: doc({title: 'Variant', body: 'Same body', tags: ['a']}),
      baseDocument: doc({title: 'Base', body: 'Same body', tags: ['a']}),
      schemaType,
    })

    expect(names(changedFields)).toEqual(['title'])
  })

  it('compares deeply, so an equal object or array is not marked', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: doc({tags: ['a', 'b']}),
      baseDocument: doc({tags: ['a', 'b']}),
      schemaType,
    })

    expect(names(changedFields)).toEqual([])
  })

  it('marks a reordered array, because granularity is the whole field', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: doc({tags: ['b', 'a']}),
      baseDocument: doc({tags: ['a', 'b']}),
      schemaType,
    })

    expect(names(changedFields)).toEqual(['tags'])
  })

  it('does not mark a field that is absent from both sides', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: doc({title: 'Same'}),
      baseDocument: doc({title: 'Same'}),
      schemaType,
    })

    expect(names(changedFields)).toEqual([])
  })

  it('never marks system fields, even when they differ', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: {...doc({title: 'Same'}), _rev: 'variant-rev'},
      baseDocument: {...doc({title: 'Same'}), _rev: 'base-rev'},
      schemaType,
    })

    expect(names(changedFields)).toEqual([])
  })

  it('ignores document fields that the schema does not declare', () => {
    const changedFields = collateVariantChangedFields({
      variantDocument: doc({title: 'Same', legacyField: 'variant'}),
      baseDocument: doc({title: 'Same', legacyField: 'base'}),
      schemaType,
    })

    expect(names(changedFields)).toEqual([])
  })

  describe('when the variant has no base document at all', () => {
    it('marks every field holding a value, including falsy ones', () => {
      const changedFields = collateVariantChangedFields({
        variantDocument: doc({title: '', body: 'Body', tags: []}),
        baseDocument: null,
        schemaType,
      })

      expect(names(changedFields)).toEqual(['body', 'tags', 'title'])
    })

    it('does not mark fields that are absent or null', () => {
      const changedFields = collateVariantChangedFields({
        variantDocument: doc({title: 'Title', body: null}),
        baseDocument: null,
        schemaType,
      })

      expect(names(changedFields)).toEqual(['title'])
    })
  })
})

describe('selectVariantBaseDocument', () => {
  const published = doc({title: 'Published'})
  const draft = {...doc({title: 'Draft'}), _id: 'drafts.article-1'} as SanityDocument
  const releaseVersion = {
    ...doc({title: 'In release'}),
    _id: 'versions.rABC.article-1',
  } as SanityDocument

  function editState(overrides: Partial<EditStateFor>): EditStateFor {
    return {
      draft: null,
      published: null,
      version: null,
      ...overrides,
    } as EditStateFor
  }

  it('compares against the base published document in the published bundle', () => {
    // An unpublished base draft is not a candidate: what matters is what Default is being served.
    expect(selectVariantBaseDocument(editState({draft, published}), 'published')).toBe(published)
  })

  it('prefers the base draft in the drafts bundle', () => {
    expect(selectVariantBaseDocument(editState({draft, published}), 'drafts')).toBe(draft)
  })

  it('falls back to the base published document when there is no base draft', () => {
    expect(selectVariantBaseDocument(editState({published}), 'drafts')).toBe(published)
  })

  it('prefers the base release version inside a release', () => {
    expect(
      selectVariantBaseDocument(editState({version: releaseVersion, draft, published}), 'rABC'),
    ).toBe(releaseVersion)
  })

  it('falls back to the ambient base for a document the release does not touch', () => {
    expect(selectVariantBaseDocument(editState({draft, published}), 'rABC')).toBe(draft)
  })

  it('returns null when the base document does not exist', () => {
    expect(selectVariantBaseDocument(editState({}), 'drafts')).toBeNull()
  })
})
