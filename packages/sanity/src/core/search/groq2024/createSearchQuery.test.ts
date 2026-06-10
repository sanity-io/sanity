import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {DEFAULT_LIMIT} from '../weighted/createSearchQuery'
import {createSearchQuery} from './createSearchQuery'

const schemaTypes = [
  defineType({
    name: 'basic-schema-test',
    type: 'document',
    preview: {
      select: {
        title: 'title',
        media: 'coverImage',
      },
    },
    fields: [
      defineField({
        name: 'title',
        type: 'string',
        options: {
          search: {
            weight: 10,
          },
        },
      }),
      defineField({
        name: 'coverImage',
        type: 'string',
      }),
      defineField({
        type: 'crossDatasetReference',
        name: 'crossDatasetReference',
        dataset: 'test',
        to: [
          {
            type: 'basic-schema-test',
            preview: {
              select: {
                title: 'title',
              },
            },
          },
        ],
      }),
      defineField({
        name: 'location',
        type: 'object',
        fields: [
          defineField({
            name: 'city',
            type: 'string',
          }),
        ],
      }),
    ],
  }),
]

describe('createSearchQuery', () => {
  describe('searchTerms', () => {
    it('should create query for basic type', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query, params} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
      )

      expect(query).toMatchInlineSnapshot(
        `
        "// findability-mvi:5
        *[_type in $__types] | score(boost(_type in ["basic-schema-test"] && title match text::query($__query), 10), ([@, _id] match text::query($__query) || references($__rawQuery))) [_score > 0] {_type, _id, _originalId, "orderings": [_score]} | order(orderings[0] desc) [0...$__limit]"
      `,
      )

      expect(params).toEqual({
        __query: '*',
        __rawQuery: '',
        __types: ['basic-schema-test'],
        __limit: DEFAULT_LIMIT + 1,
      })
    })

    it('should produce valid GROQ scoring expressions', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          isCrossDataset: true,
        },
      )

      expect(query).not.toMatch(
        'boost(_type in ["basic-schema-test"] && coverImage match text::query($__query), undefined)',
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types] | score(boost(_type in ["basic-schema-test"] && title match text::query($__query), 10), ([@, _id] match text::query($__query) || references($__rawQuery))) [_score > 0] {_type, _id, _originalId, "orderings": [_score]} | order(orderings[0] desc) [0...$__limit]"
      `)
    })
  })

  describe('searchOptions', () => {
    it('should use provided limit (plus one to determine existence of next page)', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {params} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        '',
        {
          limit: 30,
        },
      )

      expect(params.__limit).toEqual(31)
    })

    it('should add configured filter and params', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query, params} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        '',
        {filter: 'randomCondition == $customParam', params: {customParam: 'custom'}},
      )

      expect(query).toContain('*[_type in $__types && (randomCondition == $customParam)]')
      expect(params.customParam).toEqual('custom')
    })

    it('should use configured tag', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {options} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        '',
        {tag: 'customTag'},
      )

      expect(options.tag).toEqual('customTag')
    })

    it('should use configured sort field and direction', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'exampleField',
            },
          ],
        },
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types && ([@, _id] match text::query($__query) || references($__rawQuery))] {_type, _id, _originalId, "orderings": [exampleField]} | order(orderings[0] desc) [0...$__limit]"
      `)

      expect(query).toContain('| order(orderings[0] desc)')
      expect(query).toContain('"orderings": [exampleField]')
    })

    it('should sort on nested fields', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'location.city',
            },
          ],
        },
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types && ([@, _id] match text::query($__query) || references($__rawQuery))] {_type, _id, _originalId, "orderings": [location.city]} | order(orderings[0] desc) [0...$__limit]"
      `)

      expect(query).toContain('| order(orderings[0] desc)')
      expect(query).toContain('"orderings": [location.city]')
    })

    it('should sort on complex GROQ expressions', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'string::length(title)',
            },
          ],
        },
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types && ([@, _id] match text::query($__query) || references($__rawQuery))] {_type, _id, _originalId, "orderings": [string::length(title)]} | order(orderings[0] desc) [0...$__limit]"
      `)

      expect(query).toContain('| order(orderings[0] desc)')
      expect(query).toContain('"orderings": [string::length(title)]')
    })

    it('should resolve `->` for reference traversal when schemaType is provided', () => {
      const referenceSchema = Schema.compile({
        types: [
          defineType({
            name: 'author',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'book',
            type: 'document',
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'author'}],
              }),
            ],
          }),
        ],
      })
      const bookType = referenceSchema.get('book')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [bookType],
        },
        '',
        {
          sort: [
            {
              direction: 'asc',
              field: 'author.name',
              schemaType: bookType,
            },
          ],
        },
      )

      expect(query).toContain('| order(orderings[0] asc)')
      expect(query).toContain('"orderings": [author->name]')
    })

    it('should resolve `->` for array index + reference traversal', () => {
      const referenceSchema = Schema.compile({
        types: [
          defineType({
            name: 'arrayMember',
            type: 'document',
            fields: [defineField({name: 'value', type: 'string'})],
          }),
          defineType({
            name: 'withArray',
            type: 'document',
            fields: [
              defineField({
                name: 'items',
                type: 'array',
                of: [defineArrayMember({type: 'reference', to: [{type: 'arrayMember'}]})],
              }),
            ],
          }),
        ],
      })
      const withArray = referenceSchema.get('withArray')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [withArray],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'items[0].value',
              schemaType: withArray,
            },
          ],
        },
      )

      expect(query).toContain('| order(orderings[0] desc)')
      expect(query).toContain('"orderings": [items[0]->value]')
    })

    it('should project every entry into the top-level orderings array, including simple ones', () => {
      const referenceSchema = Schema.compile({
        types: [
          defineType({
            name: 'author',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'book',
            type: 'document',
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'author'}],
              }),
            ],
          }),
        ],
      })
      const bookType = referenceSchema.get('book')

      const {query, sortOrder} = createSearchQuery(
        {
          query: 'test',
          types: [bookType],
        },
        '',
        {
          sort: [
            {direction: 'asc', field: 'title', schemaType: bookType, mapWith: 'lower'},
            {direction: 'desc', field: 'author.name', schemaType: bookType},
          ],
        },
      )

      // Both entries are projected into the top-level `orderings`
      // array — even `title`, which is a simple top-level field, is
      // projected there. This keeps the result shape predictable
      // and the implementation free of conditional branches.
      expect(query).toContain('| order(lower(orderings[0]) asc,orderings[1] desc)')
      expect(query).toContain('"orderings": [title, author->name]')
      // Base projection fields are still emitted at the top level
      // alongside `orderings`.
      expect(query).toContain('{_type, _id, _originalId, "orderings":')

      // Resolved positions in `orderings` are written back onto
      // the sort order.
      expect(sortOrder[0].projectionIndex).toBe(0)
      expect(sortOrder[1].projectionIndex).toBe(1)
    })

    it('should expose compiledSortEntries for cursor predicate construction', () => {
      const referenceSchema = Schema.compile({
        types: [
          defineType({
            name: 'author',
            type: 'document',
            fields: [defineField({name: 'name', type: 'string'})],
          }),
          defineType({
            name: 'book',
            type: 'document',
            fields: [
              defineField({name: 'title', type: 'string'}),
              defineField({
                name: 'author',
                type: 'reference',
                to: [{type: 'author'}],
              }),
            ],
          }),
        ],
      })
      const bookType = referenceSchema.get('book')

      const {compiledSortEntries} = createSearchQuery(
        {
          query: 'test',
          types: [bookType],
        },
        '',
        {
          sort: [
            {direction: 'asc', field: 'title', schemaType: bookType},
            {direction: 'desc', field: 'author.name', schemaType: bookType},
          ],
        },
      )

      expect(compiledSortEntries).toEqual([
        {expression: 'title', projectionIndex: 0},
        {expression: 'author->name', projectionIndex: 1},
      ])
    })

    it('should use multiple sort fields and directions', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'exampleField',
            },
            {
              direction: 'asc',
              field: 'anotherExampleField',
            },
            {
              direction: 'asc',
              field: 'mapWithField',
              mapWith: 'lower',
            },
          ],
        },
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types && ([@, _id] match text::query($__query) || references($__rawQuery))] {_type, _id, _originalId, "orderings": [exampleField, anotherExampleField, mapWithField]} | order(orderings[0] desc,orderings[1] asc,lower(orderings[2]) asc) [0...$__limit]"
      `)

      expect(query).toContain('| order(orderings[0] desc,orderings[1] asc,lower(orderings[2]) asc)')
      expect(query).toContain('"orderings": [exampleField, anotherExampleField, mapWithField]')
    })

    it('should generate null sorting override when nulls is specified', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          sort: [
            {
              direction: 'desc',
              field: 'exampleField',
              nulls: 'last',
            },
          ],
        },
      )

      // Null-sort override addresses the projected position, not
      // the raw field, since by the time `order(...)` runs the
      // value lives at `orderings[0]`.
      expect(query).toContain('order(select(defined(orderings[0]) => 0, 1),orderings[0] desc)')
    })

    it('should order results by _score desc if no sort field and direction is configured', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types] | score(boost(_type in ["basic-schema-test"] && title match text::query($__query), 10), ([@, _id] match text::query($__query) || references($__rawQuery))) [_score > 0] {_type, _id, _originalId, "orderings": [_score]} | order(orderings[0] desc) [0...$__limit]"
      `)

      // `_score` is added by the upstream `score()` operator and
      // projected into `orderings[0]` like any other sort field.
      expect(query).toContain('| order(orderings[0] desc)')
      expect(query).toContain('"orderings": [_score]')
    })

    it('should prepend comments (with new lines) if comments is configured', () => {
      const testType = Schema.compile({
        types: schemaTypes,
      }).get('basic-schema-test')

      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
        {
          comments: ['foo=1', 'bar'],
        },
      )
      const lines = query.split('\n')
      expect(lines[0]).toEqual(`// findability-mvi:5`)
      expect(lines[1]).toEqual('// foo=1')
      expect(lines[2]).toEqual('// bar')
    })
  })

  describe('search config', () => {
    it('should handle indexed array fields in an optimized manner', () => {
      const {query} = createSearchQuery(
        {
          query: 'term0 term1',
          types: [
            Schema.compile({
              types: [
                defineType({
                  name: 'numbers-in-path',
                  type: 'document',
                  fields: [
                    defineField({
                      name: 'cover',
                      type: 'array',
                      of: [
                        defineArrayMember({
                          type: 'object',
                          fields: [
                            defineField({
                              name: 'cards',
                              type: 'array',
                              of: [
                                defineArrayMember({
                                  type: 'object',
                                  fields: [
                                    defineField({
                                      name: 'title',
                                      type: 'string',
                                      options: {
                                        search: {
                                          weight: 5,
                                        },
                                      },
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }).get('numbers-in-path'),
          ],
        },
        '',
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types] | score(boost(_type in ["numbers-in-path"] && cover[].cards[].title match text::query($__query), 5), ([@, _id] match text::query($__query) || references($__rawQuery))) [_score > 0] {_type, _id, _originalId, "orderings": [_score]} | order(orderings[0] desc) [0...$__limit]"
      `)

      expect(query).toContain('cover[].cards[].title match text::query($__query), 5)')
    })
  })
})
