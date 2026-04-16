import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {buildPreviewProjection} from './buildPreviewProjection'

function makeObjectType(
  name: string,
  fields: {name: string; type: Partial<SchemaType>}[],
  preview?: {select: Record<string, string>},
): SchemaType {
  return {
    name,
    jsonType: 'object',
    fields: fields.map((f) => ({
      name: f.name,
      type: {name: f.type.name || 'string', jsonType: 'string', ...f.type} as SchemaType,
    })),
    preview,
  } as unknown as SchemaType
}

function makeRefType(name: string, to: SchemaType[]): Partial<SchemaType> {
  return {
    name: 'reference',
    jsonType: 'object',
    to,
  } as any
}

function makeCrossDatasetRefType(): Partial<SchemaType> {
  return {
    name: 'crossDatasetReference',
    jsonType: 'object',
    to: [],
  } as any
}

describe('buildPreviewProjection', () => {
  describe('without schema type (flat fallback)', () => {
    it('returns flat field list from paths', () => {
      const result = buildPreviewProjection([['title'], ['author', 'name']])
      expect(result.flat).toBe(false)
      expect(result.projection).toBe('_id,_rev,_type,title,author')
    })

    it('deduplicates heads from multi-segment paths', () => {
      const result = buildPreviewProjection([
        ['author', 'name'],
        ['author', 'image'],
      ])
      expect(result.projection).toBe('_id,_rev,_type,author')
    })

    it('handles single-segment paths', () => {
      const result = buildPreviewProjection([['title'], ['subtitle']])
      expect(result.projection).toBe('_id,_rev,_type,title,subtitle')
    })
  })

  describe('with schema type — no references', () => {
    it('falls back to flat=false when no references to flatten', () => {
      const type = makeObjectType('book', [
        {name: 'title', type: {name: 'string'}},
        {name: 'subtitle', type: {name: 'string'}},
      ])
      const result = buildPreviewProjection([['title'], ['subtitle']], type)
      expect(result.flat).toBe(false)
      expect(result.projection).toBe('_id,_rev,_type,title,subtitle')
    })
  })

  describe('with schema type — same-dataset references', () => {
    it('generates dereference syntax for reference fields', () => {
      const authorType = makeObjectType('author', [{name: 'name', type: {name: 'string'}}])
      const bookType = makeObjectType('book', [
        {name: 'title', type: {name: 'string'}},
        {name: 'author', type: makeRefType('reference', [authorType])},
      ])

      const result = buildPreviewProjection([['title'], ['author', 'name']], bookType)

      expect(result.flat).toBe(true)
      expect(result.projection).toBe('_id,_rev,_type,title,"author": author->{_id,_rev,_type,name}')
    })

    it('handles multiple fields from same reference', () => {
      const authorType = makeObjectType('author', [
        {name: 'name', type: {name: 'string'}},
        {name: 'image', type: {name: 'image'}},
      ])
      const bookType = makeObjectType('book', [
        {name: 'title', type: {name: 'string'}},
        {name: 'author', type: makeRefType('reference', [authorType])},
      ])

      const result = buildPreviewProjection(
        [['title'], ['author', 'name'], ['author', 'image']],
        bookType,
      )

      expect(result.flat).toBe(true)
      expect(result.projection).toBe(
        '_id,_rev,_type,title,"author": author->{_id,_rev,_type,name,image}',
      )
    })

    it('handles multiple reference fields', () => {
      const personType = makeObjectType('person', [{name: 'name', type: {name: 'string'}}])
      const bookType = makeObjectType('book', [
        {name: 'author', type: makeRefType('reference', [personType])},
        {name: 'editor', type: makeRefType('reference', [personType])},
      ])

      const result = buildPreviewProjection(
        [
          ['author', 'name'],
          ['editor', 'name'],
        ],
        bookType,
      )

      expect(result.flat).toBe(true)
      expect(result.projection).toBe(
        '_id,_rev,_type,"author": author->{_id,_rev,_type,name},"editor": editor->{_id,_rev,_type,name}',
      )
    })
  })

  describe('cross-dataset reference fallback', () => {
    it('falls back to flat projection when a path crosses a cross-dataset ref', () => {
      const bookType = makeObjectType('book', [
        {name: 'title', type: {name: 'string'}},
        {name: 'externalAuthor', type: makeCrossDatasetRefType()},
      ])

      const result = buildPreviewProjection([['title'], ['externalAuthor', 'name']], bookType)

      expect(result.flat).toBe(false)
      expect(result.projection).toBe('_id,_rev,_type,title,externalAuthor')
    })
  })

  describe('implicit/missing fields', () => {
    it('handles _createdAt and _updatedAt as leaves (no refs, falls back)', () => {
      const type = makeObjectType('book', [{name: 'title', type: {name: 'string'}}])
      const result = buildPreviewProjection([['title'], ['_createdAt'], ['_updatedAt']], type)
      expect(result.flat).toBe(false)
      expect(result.projection).toBe('_id,_rev,_type,title,_createdAt,_updatedAt')
    })

    it('falls back if a multi-segment path has an unknown first segment', () => {
      const type = makeObjectType('book', [{name: 'title', type: {name: 'string'}}])
      const result = buildPreviewProjection([['title'], ['nonexistent', 'name']], type)
      expect(result.flat).toBe(false)
    })
  })

  describe('nested objects (non-reference)', () => {
    it('falls back when only nested objects, no references to flatten', () => {
      const addressType = makeObjectType('address', [{name: 'city', type: {name: 'string'}}])
      const companyType = makeObjectType('company', [
        {name: 'name', type: {name: 'string'}},
        {name: 'address', type: addressType},
      ])

      const result = buildPreviewProjection([['name'], ['address', 'city']], companyType)

      // No reference fields → no benefit from flat approach
      expect(result.flat).toBe(false)
      expect(result.projection).toBe('_id,_rev,_type,name,address')
    })

    it('generates nested projection for inline objects alongside references', () => {
      const addressType = makeObjectType('address', [{name: 'city', type: {name: 'string'}}])
      const personType = makeObjectType('person', [{name: 'name', type: {name: 'string'}}])
      const companyType = makeObjectType('company', [
        {name: 'name', type: {name: 'string'}},
        {name: 'address', type: addressType},
        {name: 'ceo', type: makeRefType('reference', [personType])},
      ])

      const result = buildPreviewProjection(
        [['name'], ['address', 'city'], ['ceo', 'name']],
        companyType,
      )

      expect(result.flat).toBe(true)
      expect(result.projection).toBe(
        '_id,_rev,_type,name,address{city},"ceo": ceo->{_id,_rev,_type,name}',
      )
    })
  })

  describe('mixed paths (leaf + reference + nested)', () => {
    it('handles a realistic preview config', () => {
      const personType = makeObjectType('person', [{name: 'name', type: {name: 'string'}}])
      const categoryType = makeObjectType('category', [{name: 'title', type: {name: 'string'}}])
      const bookType = makeObjectType('book', [
        {name: 'title', type: {name: 'string'}},
        {name: 'author', type: makeRefType('reference', [personType])},
        {name: 'category', type: makeRefType('reference', [categoryType])},
      ])

      const result = buildPreviewProjection(
        [['title'], ['author', 'name'], ['category', 'title'], ['_createdAt'], ['_updatedAt']],
        bookType,
      )

      expect(result.flat).toBe(true)
      expect(result.projection).toBe(
        '_id,_rev,_type,title,"author": author->{_id,_rev,_type,name},"category": category->{_id,_rev,_type,title},_createdAt,_updatedAt',
      )
    })
  })
})
