import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {evaluate, parse} from 'groq-js'
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
  const dataset = [
    // No `_system` at all: `string::startsWith(null, …)` is `null` and `!(false || null)` is
    // `null`, which a GROQ filter treats as excluded. The `== true` comparison keeps the clause
    // boolean, so these documents must survive.
    {_id: 'book', _type: 'book'},
    {_id: 'drafts.book', _type: 'book'},
    {_id: 'book-without-bundle', _type: 'book', _system: {}},
    {_id: 'versions.rJmP4k.book', _type: 'book', _system: {bundleId: 'rJmP4k'}},
    // Neither leg is a prefix match, so the `agent-` hyphen is load bearing.
    {_id: 'versions.agentic.book', _type: 'book', _system: {bundleId: 'agentic'}},
    {_id: 'versions.agent-12334.book', _type: 'book', _system: {bundleId: 'agent-12334'}},
    // Variant-scoped agent version: the id is an opaque hash, only `_system` names the bundle.
    {_id: 'versions.Hf82nd.book', _type: 'book', _system: {bundleId: 'agent-12334'}},
  ]

  async function keptIds(): Promise<string[]> {
    const result = await evaluate(parse(`*[${EXCLUDE_AGENT_VERSIONS_FILTER}]._id`), {dataset})
    return result.get()
  }

  it('keeps every document that is not a Content Agent version', async () => {
    await expect(keptIds()).resolves.toEqual([
      'book',
      'drafts.book',
      'book-without-bundle',
      'versions.rJmP4k.book',
      'versions.agentic.book',
    ])
  })

  it('drops agent versions named by id and by _system.bundleId alone', async () => {
    await expect(keptIds()).resolves.not.toContain('versions.agent-12334.book')
    await expect(keptIds()).resolves.not.toContain('versions.Hf82nd.book')
  })
})
