import {Schema} from '@sanity/schema'
import {renderHook} from '@testing-library/react'
import {defer, lastValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useClient} from '../../hooks'
import {getSearchableTypes, type SearchTerms} from '../common'
import {createWeightedSearch} from './createWeightedSearch'

// Mock client
vi.mock('../../hooks', () => ({
  useClient: () => ({
    observable: {
      fetch: vi.fn(),
    },
    withConfig: vi.fn().mockReturnValue({observable: {fetch: vi.fn().mockReturnValue(searchHits)}}),
  }),
}))

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {name: 'book', title: 'Book', type: 'document', fields: [{name: 'title', type: 'string'}]},
  ],
})

const searchHits = defer(() =>
  of([
    {_id: 'id0', _type: 'book', w0: 'id0', w1: 'book', w2: 'Harry Potter'},
    {_id: 'id1', _type: 'book', w0: 'id1', w1: 'book', w2: 'Harry'},
  ]),
)

const {
  result: {current: client},
} = renderHook(() => useClient())
const search = createWeightedSearch(getSearchableTypes(mockSchema), client, {unique: true})

beforeEach(() => {
  ;(client.observable.fetch as Mock).mockReset()
  ;(client.observable.fetch as Mock).mockReturnValue(searchHits)
})

describe('createWeightedSearch', () => {
  it('overrides to use vX api version', async () => {
    await lastValueFrom(
      search({query: 'harry', types: []} as SearchTerms, {perspective: ['r123', 'drafts']}),
    )

    expect(client.withConfig).toHaveBeenCalledWith({apiVersion: 'v2025-02-19'})
  })

  it('should order hits by score by default', async () => {
    const result = await lastValueFrom(search({query: 'harry', types: []} as SearchTerms))

    expect(result.hits[0].score).toEqual(10)
    expect(result.hits[1].score).toEqual(2.5)
  })

  it('should not order hits by score if skipSortByScore is enabled', async () => {
    const result = await lastValueFrom(
      search({query: 'harry', types: []} as SearchTerms, {
        skipSortByScore: true,
      }),
    )

    expect(result.hits[0].score).toEqual(2.5)
    expect(result.hits[1].score).toEqual(10)
  })
})
