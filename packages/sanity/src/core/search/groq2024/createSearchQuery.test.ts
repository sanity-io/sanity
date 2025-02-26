import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {DEFAULT_LIMIT} from '../weighted/createSearchQuery'
import {createSearchQuery} from './createSearchQuery'

const testType = Schema.compile({
  types: [
    defineType({
      name: 'basic-schema-test',
      type: 'document',
      preview: {
        select: {
          title: 'title',
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
      ],
    }),
  ],
}).get('basic-schema-test')

describe('createSearchQuery', () => {
  describe('searchTerms', () => {
    it('should create query for basic type', () => {
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
        *[_type in $__types] | score(boost(_type in ["basic-schema-test"] && title match text::query($__query), 10), [@, _id] match text::query($__query)) | order(_score desc) [_score > 0] [0...$__limit] {_score, _type, _id, _originalId}"
      `,
      )

      expect(params).toEqual({
        __query: '*',
        __types: ['basic-schema-test'],
        __limit: DEFAULT_LIMIT + 1,
      })
    })
  })

  describe('searchOptions', () => {
    it('should include drafts by default', () => {
      const {query, options} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        '',
      )

      expect(query).not.toMatch(`!(_id in path('drafts.**'))`)
      expect(options.perspective).toBe('raw')
    })

    it('should exclude drafts when configured', () => {
      const {query, options} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        '',
        {includeDrafts: false},
      )

      expect(query).toMatch(`!(_id in path('drafts.**'))`)
      expect(options.perspective).toBe('raw')
    })

    it('should use `raw` perspective when no perspective provided', () => {
      const {options} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        '',
      )

      expect(options.perspective).toBe('raw')
    })

    it('should use `raw` perspective when empty perspective array provided', () => {
      const {options} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        '',
        {perspective: []},
      )

      expect(options.perspective).toBe('raw')
    })

    it('should use provided limit (plus one to determine existence of next page)', () => {
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
        *[_type in $__types && [@, _id] match text::query($__query)] | order(exampleField desc) [0...$__limit] {exampleField, _type, _id, _originalId}"
      `)

      expect(query).toContain('| order(exampleField desc)')
    })

    it('should use multiple sort fields and directions', () => {
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
        *[_type in $__types && [@, _id] match text::query($__query)] | order(exampleField desc,anotherExampleField asc,lower(mapWithField) asc) [0...$__limit] {exampleField, anotherExampleField, mapWithField, _type, _id, _originalId}"
      `)

      expect(query).toContain(
        '| order(exampleField desc,anotherExampleField asc,lower(mapWithField) asc)',
      )
    })

    it('should order results by _score desc if no sort field and direction is configured', () => {
      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        '',
      )

      expect(query).toMatchInlineSnapshot(`
        "// findability-mvi:5
        *[_type in $__types] | score(boost(_type in ["basic-schema-test"] && title match text::query($__query), 10), [@, _id] match text::query($__query)) | order(_score desc) [_score > 0] [0...$__limit] {_score, _type, _id, _originalId}"
      `)

      expect(query).toContain('| order(_score desc)')
    })

    it('should prepend comments (with new lines) if comments is configured', () => {
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
        *[_type in $__types] | score(boost(_type in ["numbers-in-path"] && cover[].cards[].title match text::query($__query), 5), [@, _id] match text::query($__query)) | order(_score desc) [_score > 0] [0...$__limit] {_score, _type, _id, _originalId}"
      `)

      expect(query).toContain('cover[].cards[].title match text::query($__query), 5)')
    })
  })
})
