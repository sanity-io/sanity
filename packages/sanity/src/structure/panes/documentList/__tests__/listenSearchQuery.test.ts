import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {firstValueFrom, of} from 'rxjs'
import {createSearch, type SearchSort} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {listenSearchQuery, resolveSearchOrdering} from '../listenSearchQuery'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  compileFieldPath: vi.fn(),
  createSearch: vi.fn(() => vi.fn(() => of({hits: []}))),
  getSearchableTypes: vi.fn(() => [{name: 'author'}]),
}))

const mockCreateSearch = vi.mocked(createSearch)

const CONFIGURED_SORT: SearchSort[] = [{field: '_updatedAt', direction: 'desc'}]

describe('resolveSearchOrdering', () => {
  it('keeps the configured order and skips score sorting when there is no search term', () => {
    expect(
      resolveSearchOrdering({searchQuery: '', sortBy: CONFIGURED_SORT, searchStrategy: 'groq2024'}),
    ).toEqual({skipSortByScore: true, sort: CONFIGURED_SORT})
  })

  it('ranks by relevance (groq2024) by prepending a _score sort entry, keeping the configured order as a tiebreaker', () => {
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: CONFIGURED_SORT,
        searchStrategy: 'groq2024',
      }),
    ).toEqual({
      skipSortByScore: false,
      sort: [
        {field: '_score', direction: 'desc'},
        {field: '_updatedAt', direction: 'desc'},
      ],
    })
  })

  it('defaults to groq2024 relevance behaviour when no strategy is provided', () => {
    expect(resolveSearchOrdering({searchQuery: 'exodus', sortBy: CONFIGURED_SORT})).toEqual({
      skipSortByScore: false,
      sort: [
        {field: '_score', direction: 'desc'},
        {field: '_updatedAt', direction: 'desc'},
      ],
    })
  })

  it('ranks by relevance (groqLegacy) via client-side score sorting without injecting a _score field', () => {
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: CONFIGURED_SORT,
        searchStrategy: 'groqLegacy',
      }),
    ).toEqual({skipSortByScore: false, sort: CONFIGURED_SORT})
  })

  it('keeps the chosen order and skips scoring when relevance is disabled, even with a search term', () => {
    const chosenSort: SearchSort[] = [{field: 'title', direction: 'asc'}]
    expect(
      resolveSearchOrdering({
        searchQuery: 'exodus',
        sortBy: chosenSort,
        searchStrategy: 'groq2024',
        useRelevance: false,
      }),
    ).toEqual({skipSortByScore: true, sort: chosenSort})
  })
})

describe('listenSearchQuery', () => {
  function runListenSearchQuery(variant?: string) {
    const client = {
      listen: vi.fn(() => of({type: 'welcome'})),
      observable: {fetch: vi.fn(() => of(['author']))},
    } as unknown as SanityClient

    return firstValueFrom(
      listenSearchQuery({
        client,
        filter: '_type == "author"',
        limit: 25,
        params: {},
        schema: {} as Schema,
        searchQuery: '',
        sort: {by: [{field: '_updatedAt', direction: 'desc'}]},
        staticTypeNames: ['author'],
        perspective: ['drafts'],
        variant,
      }),
    )
  }

  it('searches within the selected variant', async () => {
    mockCreateSearch.mockClear()
    const search = vi.fn(() => of({hits: []}))
    mockCreateSearch.mockReturnValue(search as never)

    await runListenSearchQuery('alpha-audience')

    expect(mockCreateSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({variant: 'alpha-audience'}),
    )
    expect(search).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({perspective: ['drafts'], variant: 'alpha-audience'}),
    )
  })

  it('omits the variant when none is selected', async () => {
    mockCreateSearch.mockClear()
    const search = vi.fn(() => of({hits: []}))
    mockCreateSearch.mockReturnValue(search as never)

    await runListenSearchQuery()

    expect(search).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({variant: undefined}),
    )
  })
})
