import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type SearchStrategy} from '@sanity/types'
import {Observable, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'
import {createActor, fromObservable, SimulatedClock} from 'xstate'

import {type SearchHit} from '../../../../../../../search/common/types'
import {type RecentSearch} from '../../../datastores/recentSearches'
import {filterDefinitions} from '../../../definitions/defaultFilters'
import {createFieldDefinitionDictionary, createFieldDefinitions} from '../../../definitions/fields'
import {createFilterDefinitionDictionary} from '../../../definitions/filters'
import {getOrderings} from '../../../definitions/getOrderings'
import {createOperatorDefinitionDictionary} from '../../../definitions/operators'
import {operatorDefinitions} from '../../../definitions/operators/defaultOperators'
import {type SearchFilter} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {type SearchRequest} from '../../../utils/searchRequest'
import {
  type GlobalSearchEvent,
  globalSearchMachine,
  type GlobalSearchResults,
  SEARCH_DEBOUNCE_MS,
} from '../globalSearchMachine'

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'age', type: 'number'},
      ],
    },
    {
      name: 'book',
      title: 'Book',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

const author = schema.get('author') as ObjectSchemaType
const book = schema.get('book') as ObjectSchemaType

const fieldDefinitions = createFieldDefinitions(schema, filterDefinitions)
const definitions = {
  fields: createFieldDefinitionDictionary(fieldDefinitions),
  filters: createFilterDefinitionDictionary(filterDefinitions),
  operators: createOperatorDefinitionDictionary(operatorDefinitions),
}

function authorFieldFilter(fieldPath: string, filterName: string, operatorType: string) {
  const field = fieldDefinitions.find(
    (definition) =>
      definition.fieldPath === fieldPath && definition.documentTypes.includes('author'),
  )
  return {fieldId: field?.id, filterName, operatorType} satisfies SearchFilter
}

const ageFilter = authorFieldFilter('age', 'number', 'numberEqual')
const nameFilter = authorFieldFilter('name', 'string', 'stringEqual')

const recentSearch: RecentSearch = {
  __recent: {index: 0, timestamp: 0},
  filters: [],
  query: 'foo',
  types: [],
}

const orderings = getOrderings({searchStrategy: 'groq2024'})

function hit(id: string): SearchHit {
  return {hit: {_id: id, _type: 'book'}}
}

function createHarness({strategy = 'groq2024'}: {strategy?: SearchStrategy} = {}) {
  const clock = new SimulatedClock()
  const requests: SearchRequest[] = []
  const searches: Subject<GlobalSearchResults>[] = []
  const logSearchLatency = vi.fn()

  const actor = createActor(
    globalSearchMachine.provide({
      actors: {
        search: fromObservable(
          ({input}: {input: {request: SearchRequest}}) =>
            new Observable<GlobalSearchResults>((subscriber) => {
              requests.push(input.request)
              const search = new Subject<GlobalSearchResults>()
              searches.push(search)
              return search.subscribe(subscriber)
            }),
        ),
      },
      actions: {
        'log search latency': (_, latency) => {
          if (latency) logSearchLatency(latency)
        },
      },
    }),
    {clock, input: {schema, definitions, strategy}},
  )
  actor.start()

  function currentSearch() {
    const search = searches.at(-1)
    if (!search) throw new Error('No search has started')
    return search
  }

  return {
    clock,
    requests,
    searches,
    logSearchLatency,
    snapshot: () => actor.getSnapshot(),
    context: () => actor.getSnapshot().context,
    send: (event: GlobalSearchEvent) => actor.send(event),
    flushDebounce: () => clock.increment(SEARCH_DEBOUNCE_MS),
    resolve: (hits: SearchHit[], nextCursor?: string) => {
      const search = currentSearch()
      search.next({type: 'groq2024', hits, nextCursor})
      search.complete()
    },
    fail: (error: Error) => currentSearch().error(error),
  }
}

describe('globalSearchMachine', () => {
  describe('searching', () => {
    it('searches the latest terms once typing pauses', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'f'})
      harness.clock.increment(200)
      harness.send({type: 'TERMS_QUERY_SET', query: 'fo'})
      harness.clock.increment(200)
      expect(harness.requests).toHaveLength(0)

      harness.clock.increment(SEARCH_DEBOUNCE_MS - 200)
      expect(harness.requests).toEqual([
        {
          options: {
            comments: [
              'findability-selected-types:0',
              'findability-sort:relevance',
              'findability-source: global',
              'findability-filter-count:0',
            ],
            limit: 25,
            perspective: 'raw',
          },
          terms: {query: 'fo', types: []},
        },
      ])
    })

    it('fetches more results per request with the GROQ legacy strategy', () => {
      const harness = createHarness({strategy: 'groqLegacy'})

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()

      expect(harness.requests[0].options).toMatchObject({
        limit: 1000,
        sort: [{direction: 'desc', field: '_updatedAt'}],
      })
    })

    it('reports loading from the start of a search until its results land', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      expect(harness.context().result).toMatchObject({loaded: false, loading: false})

      harness.flushDebounce()
      expect(harness.context().result).toMatchObject({loaded: false, loading: true})

      harness.resolve([hit('a')])
      expect(harness.context().result).toEqual({
        error: null,
        hasLocal: true,
        hits: [hit('a')],
        loaded: true,
        loading: false,
      })
    })

    it('cancels the in-flight search when the terms change, and stays loading until the next one lands', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.send({type: 'TERMS_QUERY_SET', query: 'food'})

      expect(harness.searches[0].observed).toBe(false)
      expect(harness.context().result.loading).toBe(true)

      harness.flushDebounce()
      harness.resolve([hit('b')])

      expect(harness.requests.map((request) => request.terms.query)).toEqual(['foo', 'food'])
      expect(harness.context().result).toMatchObject({hits: [hit('b')], loading: false})
    })

    it('ignores changes that leave the request as it was, such as trailing whitespace', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.send({type: 'TERMS_QUERY_SET', query: 'foo '})
      harness.send({type: 'ORDERING_SET', ordering: orderings.relevance})
      harness.flushDebounce()

      expect(harness.searches[0].observed).toBe(true)
      expect(harness.requests).toHaveLength(1)
    })

    it('replaces the hits with the results of a changed search', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.resolve([hit('a'), hit('b')])
      harness.send({type: 'TERMS_QUERY_SET', query: 'food'})
      harness.flushDebounce()
      harness.resolve([hit('b'), hit('c')])

      expect(harness.context().result.hits).toEqual([hit('b'), hit('c')])
    })

    it('drops the results as soon as the terms become unsearchable, and settles without searching', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.resolve([hit('a')], 'cursorA')
      harness.send({type: 'TERMS_QUERY_SET', query: ''})

      expect(harness.context().result.hits).toEqual([])
      expect(harness.context().nextCursor).toBeNull()

      harness.flushDebounce()
      expect(harness.requests).toHaveLength(1)
      expect(harness.context().result).toMatchObject({hits: [], loaded: true, loading: false})
    })

    it('reports a failed search, and clears the error once a search succeeds', () => {
      const harness = createHarness()
      const error = new Error('search exploded')

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.fail(error)
      expect(harness.context().result).toMatchObject({error, loaded: false, loading: false})

      harness.send({type: 'TERMS_QUERY_SET', query: 'food'})
      harness.flushDebounce()
      harness.resolve([hit('a')])
      expect(harness.context().result).toMatchObject({error: null, hits: [hit('a')]})
    })
  })

  describe('filters', () => {
    it('does not search again for a filter without a value, although it narrows the document types', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})
      harness.flushDebounce()
      harness.resolve([])
      expect(harness.requests[0].terms.types.map((type) => type.name)).toEqual(['author'])

      harness.send({type: 'TERMS_FILTERS_REMOVE', filterKey: getFilterKey(ageFilter)})
      harness.flushDebounce()

      expect(harness.context().documentTypesNarrowed).toEqual([])
      expect(harness.requests).toHaveLength(1)
    })

    it('searches with the narrowed document types once a filter is complete', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.send({type: 'TERMS_FILTERS_ADD', filter: nameFilter})
      harness.send({
        type: 'TERMS_FILTERS_SET_VALUE',
        filterKey: getFilterKey(nameFilter),
        value: 'x',
      })
      harness.flushDebounce()
      harness.resolve([])

      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})
      harness.flushDebounce()
      expect(harness.requests).toHaveLength(1)

      harness.send({type: 'TERMS_FILTERS_SET_VALUE', filterKey: getFilterKey(ageFilter), value: 42})
      harness.flushDebounce()

      expect(harness.requests).toHaveLength(2)
      const [, request] = harness.requests
      expect(request.terms.filter).toBe('name == "x" && age == 42')
      expect(request.terms.types.map((type) => type.name)).toEqual(['author'])
      expect(request.options?.comments).toContain('findability-filter-count:2')
    })

    it('opens with the initial value of its operator and is remembered as the last added filter', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})

      expect(harness.context().filters).toEqual([{...ageFilter, value: null}])
      expect(harness.context().lastAddedFilter).toBe(harness.context().filters[0])
      expect(harness.context().documentTypesNarrowed).toEqual(['author'])
    })

    it('resets the value when switching to an operator with a different input', () => {
      const harness = createHarness()
      const filterKey = getFilterKey(ageFilter)

      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})
      harness.send({type: 'TERMS_FILTERS_SET_VALUE', filterKey, value: 42})
      harness.send({type: 'TERMS_FILTERS_SET_OPERATOR', filterKey, operatorType: 'numberGt'})
      expect(harness.context().filters[0]).toMatchObject({operatorType: 'numberGt', value: 42})

      harness.send({type: 'TERMS_FILTERS_SET_OPERATOR', filterKey, operatorType: 'numberRange'})
      expect(harness.context().filters[0]).toMatchObject({operatorType: 'numberRange', value: null})
    })

    it('removes a filter by key', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_FILTERS_ADD', filter: nameFilter})
      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})
      harness.send({type: 'TERMS_FILTERS_REMOVE', filterKey: getFilterKey(nameFilter)})
      harness.send({type: 'TERMS_FILTERS_REMOVE', filterKey: 'missing'})

      expect(harness.context().filters.map(getFilterKey)).toEqual([getFilterKey(ageFilter)])
    })

    it('drops field filters that no longer apply when a document type is selected', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_FILTERS_ADD', filter: ageFilter})
      harness.send({type: 'TERMS_TYPE_ADD', schemaType: book})

      expect(harness.context().filters).toEqual([])
      expect(harness.context().documentTypesNarrowed).toEqual(['book'])
      expect(harness.context().terms.types).toEqual([book])
    })
  })

  describe('recent searches', () => {
    it('applies a recent search with its filters and marks the request it causes', () => {
      const harness = createHarness()

      harness.send({
        type: 'TERMS_SET',
        terms: {...recentSearch, types: [author]},
        filters: [{...ageFilter, value: 42}],
      })

      expect(harness.context()).toMatchObject({
        documentTypesNarrowed: ['author'],
        filters: [{...ageFilter, value: 42}],
        lastAddedFilter: null,
      })
      expect(harness.context().terms).toMatchObject({
        __recent: recentSearch.__recent,
        filter: 'age == 42',
      })

      harness.flushDebounce()
      expect(harness.requests[0].options?.comments).toContain('findability-recent-search:0')
    })

    it.each<GlobalSearchEvent>([
      {type: 'PAGE_INCREMENT'},
      {type: 'ORDERING_RESET'},
      {type: 'ORDERING_SET', ordering: orderings.createdDesc},
      {type: 'TERMS_QUERY_SET', query: 'bar'},
      {type: 'TERMS_TYPE_ADD', schemaType: book},
      {type: 'TERMS_TYPE_REMOVE', schemaType: book},
      {type: 'TERMS_TYPES_CLEAR'},
    ])('are no longer marked as recent after $type', (event) => {
      const harness = createHarness()

      harness.send({type: 'TERMS_SET', terms: recentSearch})
      expect(harness.context().terms).toHaveProperty('__recent')

      harness.send(event)
      expect(harness.context().terms).not.toHaveProperty('__recent')
    })
  })

  describe('ordering', () => {
    it('orders by relevance with `_updatedAt` as a tiebreaker with the GROQ legacy strategy', () => {
      expect(createHarness({strategy: 'groqLegacy'}).context().ordering).toMatchInlineSnapshot(`
        {
          "customMeasurementLabel": "relevance",
          "sort": {
            "direction": "desc",
            "field": "_updatedAt",
          },
          "titleKey": "search.ordering.best-match-label",
        }
      `)
    })

    it('searches with the selected ordering', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.send({type: 'ORDERING_SET', ordering: orderings.createdDesc})
      harness.flushDebounce()

      expect(harness.requests[0].options).toMatchObject({
        comments: expect.arrayContaining(['findability-sort:_createdAt desc']),
        skipSortByScore: true,
        sort: [{direction: 'desc', field: '_createdAt'}],
      })
    })
  })

  describe('pagination', () => {
    function paginate() {
      const harness = createHarness()
      harness.send({type: 'TERMS_QUERY_SET', query: 'test query a'})
      harness.flushDebounce()
      harness.resolve([], 'cursorA')
      harness.send({type: 'PAGE_INCREMENT'})
      harness.flushDebounce()
      harness.resolve([], 'cursorB')
      return harness
    }

    it('searches the next page from the cursor of the previous one and appends its hits', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.resolve([hit('a'), hit('b')], 'cursorA')
      harness.send({type: 'PAGE_INCREMENT'})
      harness.flushDebounce()

      expect(harness.requests[1].options?.cursor).toBe('cursorA')

      harness.resolve([hit('b'), hit('c')])
      expect(harness.context().result.hits).toEqual([hit('a'), hit('b'), hit('c')])
      expect(harness.context().nextCursor).toBeNull()
    })

    it.each<GlobalSearchEvent>([
      {type: 'TERMS_QUERY_SET', query: 'test query b'},
      {type: 'TERMS_SET', terms: {query: 'test', types: []}},
      {type: 'ORDERING_SET', ordering: orderings.createdDesc},
      {type: 'ORDERING_RESET'},
      {type: 'TERMS_FILTERS_ADD', filter: {filterName: 'test', operatorType: 'test'}},
      {type: 'TERMS_FILTERS_REMOVE', filterKey: 'test'},
      {type: 'TERMS_FILTERS_SET_OPERATOR', filterKey: 'test', operatorType: 'test'},
      {type: 'TERMS_FILTERS_SET_VALUE', filterKey: 'test'},
      {type: 'TERMS_FILTERS_CLEAR'},
      {type: 'TERMS_TYPE_ADD', schemaType: book},
      {type: 'TERMS_TYPE_REMOVE', schemaType: book},
      {type: 'TERMS_TYPES_CLEAR'},
    ])('starts over when $type changes the search', (event) => {
      const harness = paginate()
      expect(harness.context()).toMatchObject({cursor: 'cursorA', nextCursor: 'cursorB'})

      harness.send(event)

      expect(harness.context()).toMatchObject({cursor: null, nextCursor: null})
      expect(harness.context().result.hasLocal).toBe(false)
    })
  })

  describe('results list position', () => {
    function withResults() {
      const harness = createHarness()
      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.resolve([hit('a')])
      harness.send({type: 'LAST_ACTIVE_INDEX_SET', index: 12})
      return harness
    }

    it('is kept while the search closes and opens again', () => {
      const harness = withResults()

      harness.send({type: 'SEARCH_OPENED'})
      harness.send({type: 'SEARCH_CLOSED'})

      expect(harness.context().lastActiveIndex).toBe(12)
    })

    it('starts at the top once a search settles', () => {
      const harness = withResults()

      harness.send({type: 'TERMS_QUERY_SET', query: 'food'})
      harness.flushDebounce()
      expect(harness.context().lastActiveIndex).toBe(12)

      harness.resolve([hit('b')])
      expect(harness.context().lastActiveIndex).toBe(0)
    })

    it('starts at the top when recent searches are shown instead', () => {
      const harness = withResults()

      harness.send({type: 'TERMS_QUERY_SET', query: ''})

      expect(harness.context().lastActiveIndex).toBe(0)
    })
  })

  describe('closing the search', () => {
    function withOrdering() {
      const harness = createHarness()
      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.send({type: 'ORDERING_SET', ordering: orderings.createdDesc})
      return harness
    }

    it('resets the ordering when closed without searchable terms', () => {
      const harness = withOrdering()

      harness.send({type: 'SEARCH_OPENED'})
      harness.send({type: 'TERMS_QUERY_SET', query: ''})
      harness.send({type: 'SEARCH_CLOSED'})

      expect(harness.context().ordering).toEqual(orderings.relevance)
      expect(harness.snapshot().matches({visibility: 'closed'})).toBe(true)
    })

    it('keeps the ordering when closed with searchable terms', () => {
      const harness = withOrdering()

      harness.send({type: 'SEARCH_OPENED'})
      harness.send({type: 'SEARCH_CLOSED'})

      expect(harness.context().ordering).toEqual(orderings.createdDesc)
    })

    it('keeps the ordering when the search starts out closed', () => {
      const harness = withOrdering()

      harness.send({type: 'TERMS_QUERY_SET', query: ''})
      harness.send({type: 'SEARCH_CLOSED'})

      expect(harness.context().ordering).toEqual(orderings.createdDesc)
    })
  })

  describe('search latency telemetry', () => {
    it('logs the latency of a search together with its outcome', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_TYPE_ADD', schemaType: book})
      harness.send({type: 'TERMS_QUERY_SET', query: 'hello'})
      harness.flushDebounce()
      harness.resolve([hit('a'), hit('b')])

      expect(harness.logSearchLatency).toHaveBeenCalledTimes(1)
      expect(harness.logSearchLatency).toHaveBeenCalledWith({
        durationMs: expect.any(Number),
        errored: false,
        queryLength: 'hello'.length,
        resultCount: 2,
        strategy: 'groq2024',
        typeFilterCount: 1,
      })
      expect(harness.logSearchLatency.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(0)
    })

    it('logs failed searches as errored', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'hello'})
      harness.flushDebounce()
      harness.fail(new Error('boom'))

      expect(harness.logSearchLatency).toHaveBeenCalledTimes(1)
      expect(harness.logSearchLatency).toHaveBeenCalledWith(
        expect.objectContaining({errored: true, resultCount: 0}),
      )
    })

    it('does not log searches that settle without searching', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'hello'})
      harness.send({type: 'TERMS_QUERY_SET', query: ''})
      harness.flushDebounce()

      expect(harness.requests).toHaveLength(0)
      expect(harness.logSearchLatency).not.toHaveBeenCalled()
    })

    it('logs one event per search that lands, skipping cancelled ones', () => {
      const harness = createHarness()

      harness.send({type: 'TERMS_QUERY_SET', query: 'foo'})
      harness.flushDebounce()
      harness.send({type: 'TERMS_QUERY_SET', query: 'food'})
      harness.flushDebounce()
      harness.resolve([hit('a')])

      expect(harness.logSearchLatency).toHaveBeenCalledTimes(1)
      expect(harness.logSearchLatency).toHaveBeenCalledWith(
        expect.objectContaining({queryLength: 'food'.length, resultCount: 1}),
      )
    })
  })
})
