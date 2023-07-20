import Schema from '@sanity/schema'
import client from 'part:@sanity/base/client'
import {defer, of} from 'rxjs'
import type {SearchTerms} from '..'
import {getSearchableTypes} from '../common/utils'
import {createWeightedSearch} from './createWeightedSearch'

// Mock client
jest.mock('part:@sanity/base/client', () => {
  const mockClient = {observable: {fetch: jest.fn()}}
  return mockClient
})

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {name: 'book', title: 'Book', type: 'document', fields: [{name: 'title', type: 'string'}]},
  ],
})

const searchHits = defer(() =>
  of([
    {_id: 'id0', _type: 'book', 0: 'id0', 1: 'book', 2: 'Harry Potter'},
    {_id: 'id1', _type: 'book', 0: 'id1', 1: 'book', 2: 'Harry'},
  ])
)

const search = createWeightedSearch(getSearchableTypes(mockSchema), client, {unique: true})

beforeEach(() => {
  ;(client.observable.fetch as jest.Mock).mockReset()
  ;(client.observable.fetch as jest.Mock).mockReturnValue(searchHits)
})

describe('createWeightedSearch', () => {
  it('should order hits by score by default', async () => {
    // @todo: replace `toPromise` with `firstValueFrom` in rxjs 7+
    const result = await search({query: 'harry', types: []} as SearchTerms).toPromise()

    expect(result[0].score).toEqual(20)
    expect(result[1].score).toEqual(4.772727272727273)
  })

  it('should not order hits by score if skipSortByScore is enabled', async () => {
    // @todo: replace `toPromise` with `firstValueFrom` in rxjs 7+
    const result = await search({query: 'harry', types: []} as SearchTerms, {
      skipSortByScore: true,
    }).toPromise()

    expect(result[0].score).toEqual(4.772727272727273)
    expect(result[1].score).toEqual(20)
  })
})
