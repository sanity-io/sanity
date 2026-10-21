import {defineField, defineType} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {useSchema} from '../../../../../../hooks/useSchema'
import {useSearch} from '../useSearch'

const orderConfirmation = defineType({
  name: 'orderConfirmation',
  type: 'document',
  preview: {select: {title: 'analytics.pageName', subtitle: 'heading'}},
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'analytics',
      type: 'object',
      fields: [defineField({name: 'pageName', type: 'string'})],
    }),
  ],
})

describe('useSearch', () => {
  it('waits for the partial index settings before searching, then respects them', async () => {
    const indexSettings$ = new Subject<unknown>()
    const client = createMockSanityClient()
    client.observable.request = () => indexSettings$

    const wrapper = await createTestProvider({
      client: client as any,
      config: {
        schema: {types: [orderConfirmation]},
        search: {unstable_partialIndexing: {enabled: true}},
      },
    })

    const {result} = renderHook(
      () =>
        useSearch({
          initialState: {error: null, hits: [], loading: false, terms: {query: '', types: []}},
          schema: useSchema(),
        }),
      {wrapper},
    )

    act(() => {
      result.current.handleSearch({debounceTime: 1, terms: {query: 'order', types: []}})
    })

    await waitFor(() => expect(result.current.searchState.loading).toBe(true))
    expect(client.$log.observable.fetch).toEqual([])

    act(() => {
      indexSettings$.next({
        partialIndexSettings: {maxFieldDepth: 2, excludeFieldPaths: ['analytics']},
      })
      indexSettings$.complete()
    })

    await waitFor(() => expect(client.$log.observable.fetch).toHaveLength(1))
    const [{query}] = client.$log.observable.fetch
    expect(query).not.toContain('analytics.pageName')
    expect(query).toContain(
      'boost(_type in ["orderConfirmation"] && heading match text::query($__query), 5)',
    )
  })
})
