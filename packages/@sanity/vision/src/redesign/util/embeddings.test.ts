import {afterEach, describe, expect, it, vi} from 'vitest'

import {type EmbeddingsClient, hasDatasetEmbeddings, resetDatasetEmbeddings} from './embeddings'

function createClient(dataset: string, settings: () => Promise<unknown>) {
  const reads: string[] = []
  const client: EmbeddingsClient = {
    config: () => ({apiHost: 'https://api.sanity.io', projectId: 'project', dataset}),
    datasets: {
      getEmbeddingsSettings: (name) => {
        reads.push(name)
        return settings()
      },
    },
  }
  return {client, reads}
}

afterEach(() => {
  resetDatasetEmbeddings()
  vi.useRealTimers()
})

describe('hasDatasetEmbeddings', () => {
  it.each([
    [{enabled: true, status: 'ready'}, true],
    [{enabled: true, status: 'indexing'}, false],
    [{enabled: false, status: 'disabled'}, false],
    [null, false],
  ])('reads %j as %s', async (settings, expected) => {
    const {client} = createClient('pokedex', async () => settings)

    expect(await hasDatasetEmbeddings(client)).toBe(expected)
  })

  it('reads each dataset once for a few minutes', async () => {
    vi.useFakeTimers()
    const pokedex = createClient('pokedex', async () => ({enabled: true, status: 'ready'}))
    const production = createClient('production', async () => ({enabled: false}))

    await Promise.all([hasDatasetEmbeddings(pokedex.client), hasDatasetEmbeddings(pokedex.client)])
    expect(await hasDatasetEmbeddings(production.client)).toBe(false)
    vi.advanceTimersByTime(4 * 60_000)
    expect(await hasDatasetEmbeddings(pokedex.client)).toBe(true)
    expect(pokedex.reads).toEqual(['pokedex'])
    expect(production.reads).toEqual(['production'])

    vi.advanceTimersByTime(2 * 60_000)
    await hasDatasetEmbeddings(pokedex.client)
    expect(pokedex.reads).toEqual(['pokedex', 'pokedex'])
  })

  it('answers false when the settings cannot be read, and reads again soon', async () => {
    vi.useFakeTimers()
    let reply: () => Promise<unknown> = () => Promise.reject(new Error('Forbidden'))
    const {client, reads} = createClient('pokedex', () => reply())

    expect(await hasDatasetEmbeddings(client)).toBe(false)
    reply = async () => ({enabled: true, status: 'ready'})
    vi.advanceTimersByTime(31_000)
    expect(await hasDatasetEmbeddings(client)).toBe(true)
    expect(reads).toEqual(['pokedex', 'pokedex'])
  })

  it('answers false for a client that cannot read dataset settings', async () => {
    const client = {
      config: () => ({projectId: 'project', dataset: 'pokedex'}),
      datasets: {
        getEmbeddingsSettings: () => {
          throw new TypeError('not a function')
        },
      },
    }

    expect(await hasDatasetEmbeddings(client)).toBe(false)
  })

  it('answers false without a dataset', async () => {
    const {client, reads} = createClient('', async () => ({enabled: true, status: 'ready'}))

    expect(await hasDatasetEmbeddings(client)).toBe(false)
    expect(reads).toEqual([])
  })
})
