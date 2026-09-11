import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {lastValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getSearchableTypes} from './common/getSearchableTypes'
import {EXCLUDE_AGENT_VERSIONS_FILTER} from './constants'
import {createSearch} from './search'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {name: 'book', title: 'Book', type: 'document', fields: [{name: 'title', type: 'string'}]},
  ],
})

const searchableTypes = getSearchableTypes(mockSchema)

const fetch = vi.fn()
const withConfig = vi.fn()
const client = {observable: {fetch}, withConfig} as unknown as SanityClient
withConfig.mockReturnValue(client)

beforeEach(() => {
  fetch.mockClear()
  fetch.mockReturnValue(of([]))
})

/** The main search query is the last fetch; groq2024 may run a reference-resolve query first. */
function lastFetchedQuery(): string {
  return fetch.mock.calls.at(-1)?.[0]
}

describe.each(['groqLegacy', 'groq2024'] as const)('createSearch (%s)', (strategy) => {
  it('excludes agent versions when searching with the raw perspective', async () => {
    const search = createSearch(searchableTypes, client, {strategy})

    await lastValueFrom(search({query: 'term', types: []}, {perspective: 'raw'}))

    expect(lastFetchedQuery()).toContain(EXCLUDE_AGENT_VERSIONS_FILTER)
  })

  it('excludes agent versions when raw is set as a factory option', async () => {
    const search = createSearch(searchableTypes, client, {strategy, perspective: 'raw'})

    await lastValueFrom(search({query: 'term', types: []}))

    expect(lastFetchedQuery()).toContain(EXCLUDE_AGENT_VERSIONS_FILTER)
  })

  it('ANDs the agent version exclusion with an existing filter', async () => {
    const search = createSearch(searchableTypes, client, {
      strategy,
      filter: 'customFilter == $customParam',
    })

    await lastValueFrom(search({query: 'term', types: []}, {perspective: 'raw'}))

    expect(lastFetchedQuery()).toContain(
      `((customFilter == $customParam) && ${EXCLUDE_AGENT_VERSIONS_FILTER})`,
    )
  })

  it('does not exclude agent versions for other perspectives', async () => {
    const search = createSearch(searchableTypes, client, {strategy})

    await lastValueFrom(search({query: 'term', types: []}, {perspective: ['r123', 'drafts']}))
    await lastValueFrom(search({query: 'term', types: []}, {perspective: 'drafts'}))
    await lastValueFrom(search({query: 'term', types: []}))

    for (const [query] of fetch.mock.calls) {
      expect(query).not.toContain(EXCLUDE_AGENT_VERSIONS_FILTER)
    }
  })
})

describe('EXCLUDE_AGENT_VERSIONS_FILTER', () => {
  it('stays boolean for documents without _system.bundleId', () => {
    // `string::startsWith(null, …)` is `null` and `!(false || null)` is `null`, which a GROQ
    // filter treats as excluded — silently dropping every published and classic draft document.
    // The `== true` comparison guards against that regression.
    expect(EXCLUDE_AGENT_VERSIONS_FILTER).toContain(
      'string::startsWith(_system.bundleId, "agent-") == true',
    )
  })
})
