/* eslint-disable camelcase */
import {FINDABILITY_MVI} from '../constants'
import {createSearchQuery, DEFAULT_LIMIT, extractTermsFromQuery} from './createSearchQuery'
import type {SearchableType} from './types'

const testType: SearchableType = {
  name: 'basic-schema-test',
  __experimental_search: [
    {
      path: ['title'],
      weight: 10,
    },
  ],
}

describe('createSearchQuery', () => {
  describe('searchTerms', () => {
    it('should create query for basic type', () => {
      const {query, params} = createSearchQuery({
        query: 'test',
        types: [testType],
      })

      expect(query).toEqual(
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (title match $t0)]' +
          '| order(_id asc)' +
          '[$__offset...$__limit]' +
          '{_type, _id, ...select(_type == "basic-schema-test" => { "w0": title })}',
      )

      expect(params).toEqual({
        t0: 'test*',
        __types: ['basic-schema-test'],
        __limit: DEFAULT_LIMIT,
        __offset: 0,
      })
    })

    it('should OR fields together per term', () => {
      const {query} = createSearchQuery({
        query: 'term0',
        types: [
          {
            name: 'basic-schema-test',
            __experimental_search: [
              {
                path: ['title'],
                weight: 10,
              },
              {
                path: ['object', 'field'],
                weight: 5,
              },
            ],
          },
        ],
      })

      expect(query).toContain('*[_type in $__types && (title match $t0 || object.field match $t0)]')
    })

    it('should have one match filter per term', () => {
      const {query, params} = createSearchQuery({
        query: 'term0 term1',
        types: [testType],
      })

      expect(query).toContain('*[_type in $__types && (title match $t0) && (title match $t1)]')
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

    it('should add extendedProjection to query', () => {
      const {query} = createSearchQuery(
        {
          query: 'term',
          types: [testType],
        },
        {
          __unstable_extendedProjection: 'object{field}',
        },
      )

      const result = [
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (title match $t0)]{_type, _id, object{field}}',
        '|order(_id asc)[$__offset...$__limit]',
        '{_type, _id, ...select(_type == "basic-schema-test" => { "w0": title })}',
      ].join('')

      expect(query).toBe(result)
    })
  })

  describe('searchOptions', () => {
    it('should exclude drafts when configured', () => {
      const {query} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        {includeDrafts: false},
      )

      expect(query).toContain("!(_id in path('drafts.**'))")
    })

    it('should use provided offset and limit', () => {
      const {params} = createSearchQuery(
        {
          query: 'term0',
          types: [testType],
        },
        {
          offset: 10,
          limit: 30,
        },
      )

      expect(params.__limit).toEqual(40) // provided offset + limit
      expect(params.__offset).toEqual(10)
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
        '*[_type in $__types && (title match $t0) && (randomCondition == $customParam)]',
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
          '*[_type in $__types && (title match $t0)]' +
          '| order(exampleField desc)' +
          '[$__offset...$__limit]' +
          '{_type, _id, ...select(_type == "basic-schema-test" => { "w0": title })}',
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

      const result = [
        `// findability-mvi:${FINDABILITY_MVI}\n`,
        '*[_type in $__types && (title match $t0)]| ',
        'order(exampleField desc,anotherExampleField asc,lower(mapWithField) asc)',
        '[$__offset...$__limit]{_type, _id, ...select(_type == "basic-schema-test" => { "w0": title })}',
      ].join('')

      expect(query).toEqual(result)
    })

    it('should order results by _id ASC if no sort field and direction is configured', () => {
      const {query} = createSearchQuery({
        query: 'test',
        types: [testType],
      })

      expect(query).toEqual(
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (title match $t0)]' +
          '| order(_id asc)' +
          '[$__offset...$__limit]' +
          '{_type, _id, ...select(_type == "basic-schema-test" => { "w0": title })}',
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
          types: [
            {
              name: 'basic-schema-test',
              __experimental_search: [
                {
                  path: ['some', 'field'],
                  weight: 10,
                  mapWith: 'dateTime',
                },
              ],
            },
          ],
        },

        {tag: 'customTag'},
      )

      expect(searchSpec).toEqual([
        {
          typeName: testType.name,
          paths: [
            {
              weight: 10,
              path: 'some.field',
              mapWith: 'dateTime',
            },
          ],
        },
      ])
    })
  })

  describe('__experimental_search', () => {
    it('should handle indexed array fields in an optimized manner', () => {
      const {query} = createSearchQuery({
        query: 'term0 term1',
        types: [
          {
            name: 'numbers-in-path',
            __experimental_search: [
              {
                path: ['cover', 0, 'cards', 0, 'title'],
                weight: 1,
              },
            ],
          },
        ],
      })

      expect(query).toEqual(
        /* Putting [number] in the filter of a query makes the whole query unoptimized by content-lake, killing performance.
         * As a workaround, we replace numbers with [] array syntax, so we at least get hits when the path matches anywhere in the array.
         * This is an improvement over before, where an illegal term was used (number-as-string, ala ["0"]),
         * which lead to no hits at all. */
        `// findability-mvi:${FINDABILITY_MVI}\n` +
          '*[_type in $__types && (cover[].cards[].title match $t0) && (cover[].cards[].title match $t1)]' +
          '| order(_id asc)' +
          '[$__offset...$__limit]' +
          // at this point we could refilter using cover[0].cards[0].title.
          // This solution was discarded at it would increase the size of the query payload by up to 50%

          // we still map out the path with number
          '{_type, _id, ...select(_type == "numbers-in-path" => { "w0": cover[0].cards[0].title })}',
      )
    })

    it('should use mapper function from __experimental_search', () => {
      const {query} = createSearchQuery({
        query: 'test',
        types: [
          {
            name: 'type1',
            __experimental_search: [
              {
                path: ['pteField'],
                weight: 1,
                mapWith: 'pt::text',
              },
            ],
          },
        ],
      })

      expect(query).toContain('*[_type in $__types && (pt::text(pteField) match $t0)')
      expect(query).toContain('...select(_type == "type1" => { "w0": pt::text(pteField) })')
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
