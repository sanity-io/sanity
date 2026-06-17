import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../schema'
import {deriveReferenceSearchSpecs} from './deriveReferenceSearchSpecs'

const MAX_DEPTH = 10

function specsForType(types: ReturnType<typeof defineType>[], typeName: string) {
  const schemaType = createSchema({name: 'test', types}).get(typeName)
  if (schemaType === undefined) {
    throw new Error(`Type "${typeName}" was not found in the compiled test schema`)
  }
  return deriveReferenceSearchSpecs({schemaType, maxDepth: MAX_DEPTH})
}

const author = defineType({
  name: 'author',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'publicationYear', type: 'number'}),
  ],
})

describe('deriveReferenceSearchSpecs', () => {
  it('derives a spec for a reference-traversing preview path', () => {
    const specs = specsForType(
      [
        author,
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {title: 'title', subtitle: 'author.name'}},
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
          ],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([{targetType: 'author', leafPath: 'name', weight: 5}])
  })

  it('ignores non-reference preview paths', () => {
    const specs = specsForType(
      [
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {title: 'title', subtitle: 'summary'}},
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'summary', type: 'string'}),
          ],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([])
  })

  it('only emits specs for searchable string/pt/slug leaves', () => {
    const specs = specsForType(
      [
        author,
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {subtitle: 'author.publicationYear'}},
          fields: [defineField({name: 'author', type: 'reference', to: [{type: 'author'}]})],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([])
  })

  it('targets the `.current` leaf of a referenced slug', () => {
    const specs = specsForType(
      [
        defineType({
          name: 'author',
          type: 'document',
          fields: [defineField({name: 'handle', type: 'slug'})],
        }),
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {subtitle: 'author.handle'}},
          fields: [defineField({name: 'author', type: 'reference', to: [{type: 'author'}]})],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([{targetType: 'author', leafPath: 'handle.current', weight: 5}])
  })

  it('flags portable text leaves with `pt::text`', () => {
    const specs = specsForType(
      [
        defineType({
          name: 'author',
          type: 'document',
          fields: [defineField({name: 'bio', type: 'array', of: [{type: 'block'}]})],
        }),
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {subtitle: 'author.bio'}},
          fields: [defineField({name: 'author', type: 'reference', to: [{type: 'author'}]})],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([{targetType: 'author', leafPath: 'bio', weight: 5, mapWith: 'pt::text'}])
  })

  it('emits a spec per target type of a multi-target reference', () => {
    const specs = specsForType(
      [
        author,
        defineType({
          name: 'organisation',
          type: 'document',
          fields: [defineField({name: 'name', type: 'string'})],
        }),
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {subtitle: 'creator.name'}},
          fields: [
            defineField({
              name: 'creator',
              type: 'reference',
              to: [{type: 'author'}, {type: 'organisation'}],
            }),
          ],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([
      {targetType: 'author', leafPath: 'name', weight: 5},
      {targetType: 'organisation', leafPath: 'name', weight: 5},
    ])
  })

  it('uses the preview key to weight the spec (title outranks subtitle)', () => {
    const specs = specsForType(
      [
        author,
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {title: 'author.name'}},
          fields: [defineField({name: 'author', type: 'reference', to: [{type: 'author'}]})],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([{targetType: 'author', leafPath: 'name', weight: 10}])
  })

  it('skips array-of-reference preview paths', () => {
    const specs = specsForType(
      [
        author,
        defineType({
          name: 'book',
          type: 'document',
          preview: {select: {subtitle: 'authors.0.name'}},
          fields: [
            defineField({
              name: 'authors',
              type: 'array',
              of: [{type: 'reference', to: [{type: 'author'}]}],
            }),
          ],
        }),
      ],
      'book',
    )

    expect(specs).toEqual([])
  })
})
