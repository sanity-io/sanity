import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {describe, expect, it, test} from 'vitest'

import {FINDABILITY_MVI} from '../constants'
import {
  createSearchQuery,
  DEFAULT_LIMIT,
  extractTermsFromQuery,
  tokenize,
} from './createSearchQuery'

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
      const {query, params} = createSearchQuery({
        query: 'test',
        types: [testType],
      })

      expect(query).toEqual(
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0)] ' +
          '{_type, _id, _originalId, "orderings": [_id], ...select(_type == "basic-schema-test" => { "w0": _id,"w1": _type,"w2": title })} ' +
          '| order(orderings[0] asc) ' +
          '[0...$__limit]',
      )

      expect(params).toEqual({
        t0: 'test*',
        __types: ['basic-schema-test'],
        __limit: DEFAULT_LIMIT,
      })
    })

    it('should OR fields together per term', () => {
      const {query} = createSearchQuery({
        query: 'term0',
        types: [
          Schema.compile({
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
                  defineField({
                    name: 'object',
                    type: 'object',
                    fields: [
                      defineField({
                        name: 'field',
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
          }).get('basic-schema-test'),
        ],
      })

      expect(query).toContain(
        '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0 || object.field match $t0)]',
      )
    })

    it('should have one match filter per term', () => {
      const {query, params} = createSearchQuery({
        query: 'term0 term1',
        types: [testType],
      })

      expect(query).toContain(
        '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0) && (_id match $t1 || _type match $t1 || title match $t1)]',
      )
      expect(params.t0).toEqual('term0*')
      expect(params.t1).toEqual('term1*')
    })

    it('should remove duplicate terms', () => {
      const {params, terms} = createSearchQuery({
        query: 'term term',
        types: [testType],
      })

      expect(params.t0).toEqual('term*')
      expect(params.t1).toBeUndefined()
      expect(terms).toEqual(['term'])
    })

    it('should project sort entries into the orderings array and use a two-projection query', () => {
      const {query} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        {
          sort: [
            {
              direction: 'asc',
              field: 'translations.se',
            },
          ],
        },
      )

      // A single projection includes the sort value via the
      // top-level `orderings` array alongside the per-spec score
      // selections, then `order(...)` runs against `orderings[N]`.
      const result = [
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0)] ' +
          '{_type, _id, _originalId, "orderings": [translations.se], ...select(_type == "basic-schema-test" => { "w0": _id,"w1": _type,"w2": title })}',
        ' | order(orderings[0] asc) [0...$__limit]',
      ].join('')

      expect(query).toBe(result)
    })

    it('projects simple sort entries into the orderings array just like complex ones', () => {
      const {query} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        {
          sort: [
            {
              direction: 'asc',
              field: 'title',
            },
          ],
        },
      )

      // Even simple top-level fields are projected into the
      // `orderings` array for a consistent, predictable shape.
      expect(query).toContain('"orderings": [title]')
      expect(query).toContain('| order(orderings[0] asc)')
      // Project must come before the order pipe.
      const projectionIndex = query.indexOf('{_type, _id, _originalId,')
      const orderIndex = query.indexOf('order(orderings[0] asc)')
      expect(projectionIndex).toBeGreaterThan(0)
      expect(orderIndex).toBeGreaterThan(projectionIndex)
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
              defineField({
                name: 'title',
                type: 'string',
                options: {search: {weight: 10}},
              }),
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
          query: 'term',
          types: [bookType],
        },
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

      // Reference traversal `author.name` is schema-resolved to
      // `author->name` and projected into `orderings[0]`.
      expect(query).toContain('"orderings": [author->name]')
      expect(query).toContain('order(orderings[0] asc)')
    })

    it('projects every entry into the orderings array in a multi-sort weighted query', () => {
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
              defineField({
                name: 'title',
                type: 'string',
                options: {search: {weight: 10}},
              }),
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
          query: 'term',
          types: [bookType],
        },
        {
          sort: [
            {
              direction: 'asc',
              field: 'title',
              schemaType: bookType,
              mapWith: 'lower',
            },
            {
              direction: 'desc',
              field: 'author.name',
              schemaType: bookType,
            },
          ],
        },
      )

      // Both entries are projected into `orderings`. `title` (the
      // simple field) takes index 0; `author.name` (resolved to
      // `author->name`) takes index 1.
      expect(query).toContain('"orderings": [title, author->name]')
      expect(query).toContain('order(lower(orderings[0]) asc,orderings[1] desc)')
    })
  })

  describe('searchOptions', () => {
    it('should use provided limit', () => {
      const {params} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        {
          limit: 30,
        },
      )

      expect(params.__limit).toEqual(30)
    })

    it('should add configured filter and params', () => {
      const {query, params} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        {filter: 'randomCondition == $customParam', params: {customParam: 'custom'}},
      )

      expect(query).toContain(
        '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0) && (randomCondition == $customParam)]',
      )
      expect(params.customParam).toEqual('custom')
    })

    it('should add configured common limit', () => {
      const {params} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        {limit: 50},
      )

      expect(params.__limit).toEqual(50)
    })

    it('should use configured tag', () => {
      const {options} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },

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
        {
          sort: [
            {
              direction: 'desc',
              field: 'exampleField',
            },
          ],
        },
      )

      expect(query).toEqual(
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0)] ' +
          '{_type, _id, _originalId, "orderings": [exampleField], ...select(_type == "basic-schema-test" => { "w0": _id,"w1": _type,"w2": title })} ' +
          '| order(orderings[0] desc) ' +
          '[0...$__limit]',
      )
    })

    it('should use multiple sort fields and directions', () => {
      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
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

      const sortExpressions = 'exampleField, anotherExampleField, mapWithField'
      const result = [
        `// findability-mvi:${FINDABILITY_MVI}\n`,
        '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0)] ',
        `{_type, _id, _originalId, "orderings": [${sortExpressions}], ...select(_type == "basic-schema-test" => { "w0": _id,"w1": _type,"w2": title })} `,
        '| order(orderings[0] desc,orderings[1] asc,lower(orderings[2]) asc) ',
        '[0...$__limit]',
      ].join('')

      expect(query).toEqual(result)
    })

    it('should generate null sorting override when nulls is specified', () => {
      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
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

      // Null-sort override addresses the projected position rather
      // than the raw field, since by the time `order(...)` runs the
      // value lives at `orderings[0]`.
      expect(query).toContain('order(select(defined(orderings[0]) => 0, 1),orderings[0] desc)')
    })

    it('should order results by _id ASC if no sort field and direction is configured', () => {
      const {query} = createSearchQuery({
        query: 'test',
        types: [testType],
      })

      // `_id` is the default sort field. Like every other sort
      // field, it's projected into the `orderings` array.
      expect(query).toEqual(
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (_id match $t0 || _type match $t0 || title match $t0)] ' +
          '{_type, _id, _originalId, "orderings": [_id], ...select(_type == "basic-schema-test" => { "w0": _id,"w1": _type,"w2": title })} ' +
          '| order(orderings[0] asc) ' +
          '[0...$__limit]',
      )
    })

    it('should prepend comments (with new lines) if comments is configured', () => {
      const {query} = createSearchQuery(
        {
          query: 'test',
          types: [testType],
        },
        {
          comments: ['foo=1', 'bar'], //'],
        },
      )
      const splitQuery = query.split('\n')
      expect(splitQuery[0]).toEqual(`// findability-mvi:${FINDABILITY_MVI}`)
      expect(splitQuery[1]).toEqual('// foo=1')
      expect(splitQuery[2]).toEqual('// bar')
    })
  })

  describe('searchSpec', () => {
    it('should include searchSpec for introspection/debug', () => {
      const {searchSpec} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },

        {tag: 'customTag'},
      )

      expect(searchSpec).toEqual([
        {
          typeName: testType.name,
          paths: [
            {
              weight: 1,
              path: '_id',
            },
            {
              weight: 1,
              path: '_type',
            },
            {
              weight: 10,
              path: 'title',
            },
          ],
        },
      ])
    })
  })

  describe('search config', () => {
    it('should handle indexed array fields in an optimized manner', () => {
      const {query} = createSearchQuery({
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
                                        weight: 1,
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
      })

      expect(query).toEqual(
        /* Putting [number] in the filter of a query makes the whole query unoptimized by content-lake, killing performance.
         * As a workaround, we replace numbers with [] array syntax, so we at least get hits when the path matches anywhere in the array.
         * This is an improvement over before, where an illegal term was used (number-as-string, ala ["0"]),
         * which lead to no hits at all. */
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (_id match $t0 || _type match $t0 || cover[].cards[].title match $t0) && (_id match $t1 || _type match $t1 || cover[].cards[].title match $t1)] ' +
          // The default `_id asc` sort is projected into the
          // `orderings` array like every other sort entry, alongside
          // the per-spec score selections — a single projection,
          // followed by `order(...)`.
          // at this point we could refilter using cover[0].cards[0].title.
          // This solution was discarded at it would increase the size of the query payload by up to 50%

          // we still map out the path with number
          '{_type, _id, _originalId, "orderings": [_id], ...select(_type == "numbers-in-path" => { "w0": _id,"w1": _type,"w2": cover[].cards[].title })} ' +
          '| order(orderings[0] asc) ' +
          '[0...$__limit]',
      )
    })
  })
})

describe('extractTermsFromQuery', () => {
  describe('should handle orphaned double quotes', () => {
    const tests: [string, string[]][] = [
      [`"foo bar`, ['foo', 'bar']],
      [`foo bar"`, ['foo', 'bar']],
      [`foo "bar`, ['foo', 'bar']],
    ]
    it.each(tests)('%s', (input, expected) => {
      expect(extractTermsFromQuery(input)).toEqual(expected)
    })
  })

  it('should treat single quotes as regular characters', () => {
    const terms = extractTermsFromQuery(`'foo ' bar'`)
    expect(terms).toEqual([`'foo`, `'`, `bar'`])
  })

  it('should tokenize all unquoted text', () => {
    const terms = extractTermsFromQuery('foo bar')
    expect(terms).toEqual(['foo', 'bar'])
  })

  it('should treat quoted text as a single token, retaining quotes', () => {
    const terms = extractTermsFromQuery(`"foo bar" baz`)
    expect(terms).toEqual([`"foo bar"`, 'baz'])
  })

  it('should strip quotes from text containing single words', () => {
    const terms = extractTermsFromQuery(`"foo"`)
    expect(terms).toEqual([`foo`])
  })
})

describe('tokenize', () => {
  const tests = [
    {input: '', expected: []},
    {input: 'foo', expected: ['foo']},
    {input: '0foo', expected: ['0foo']},
    {input: 'a16z', expected: ['a16z']},
    {input: 'foo,,, ,    ,foo,bar', expected: ['foo', 'foo', 'bar']},
    {input: 'pho-bar, foo-bar', expected: ['pho', 'bar', 'foo', 'bar']},
    {input: '0 foo', expected: ['0', 'foo']},
    {input: 'foo 🤪🤪🤪', expected: ['foo', '🤪🤪🤪']},
    {input: 'foo 🤪🤪🤪 bar', expected: ['foo', '🤪🤪🤪', 'bar']},
    {input: '1 2 3', expected: ['1', '2', '3']},
    {input: 'foo, bar, baz', expected: ['foo', 'bar', 'baz']},
    {input: 'foo   , bar   , baz', expected: ['foo', 'bar', 'baz']},
    {input: 'a.b.c', expected: ['a.b.c']},
    {input: 'sanity.io', expected: ['sanity.io']},
    {input: 'fourty-two', expected: ['fourty', 'two']},
    {
      input: 'full stop. Then new beginning',
      expected: ['full', 'stop', 'Then', 'new', 'beginning'],
    },
    {input: 'about .io domains', expected: ['about', 'io', 'domains']},
    {input: 'abc -23 def', expected: ['abc', '23', 'def']},
    {input: 'banana&[friends]\\/ barnåler', expected: ['banana', 'friends', 'barnåler']},
    {input: 'banana&friends barnåler', expected: ['banana', 'friends', 'barnåler']},
    {input: 'ban*ana*', expected: ['ban', 'ana']},
    {
      input: '한국인은 banana 동의하지 않는다',
      expected: ['한국인은', 'banana', '동의하지', '않는다'],
    },
    {input: '한국인은    동의2하지', expected: ['한국인은', '동의2하지']},
  ]

  tests.forEach(({input, expected}) => {
    test('tokenization of search input string', () => {
      expect(tokenize(input)).toEqual(expected)
    })
  })
})
