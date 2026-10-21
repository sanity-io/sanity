import {type PromptRequest} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {QUERY_URL_SIZE_LIMIT} from '../../util/queryRequestMethod'
import {type ExplainQueryClient, explainQuery, fetchQueryPlan} from './explainQuery'

const PLAN = 'Pipeline {\n  r1: StreamStep {\n    $0: Fetch {Filter: (_type == "author")}\n  }\n}\n'

/** A query without params that encodes to `?query=` of exactly `size` characters */
const queryOfEncodedSize = (size: number) => '*'.repeat(size - '?query='.length)

type RecordedRequest = Omit<Parameters<ExplainQueryClient['request']>[0], 'signal'>

function createClient(responses: {request?: unknown; prompt?: unknown}) {
  const requests: RecordedRequest[] = []
  const prompts: {apiVersion: string; request: PromptRequest}[] = []
  const client: ExplainQueryClient = {
    getDataUrl: (operation, path = '') => `/data/${operation}/test${path}`,
    request: ({signal: _signal, ...request}) => {
      requests.push(request)
      return Promise.resolve(responses.request)
    },
    withConfig: ({apiVersion}) => ({
      agent: {
        action: {
          prompt: (request) => {
            prompts.push({apiVersion, request})
            return Promise.resolve(responses.prompt)
          },
        },
      },
    }),
  }
  return {client, requests, prompts}
}

const query = {query: '*[_type == $type]', params: {type: 'author'}}

describe('fetchQueryPlan', () => {
  it('requests the query with explain, params included, and returns the plan', async () => {
    const {client, requests} = createClient({request: {result: [], explain: PLAN}})
    expect(await fetchQueryPlan(client, query)).toBe(PLAN.trim())
    expect(requests).toHaveLength(1)
    const url = new URL(requests[0].url, 'https://example.api.sanity.io')
    expect(url.pathname).toBe('/data/query/test')
    expect(url.searchParams.get('query')).toBe('*[_type == $type]')
    expect(url.searchParams.get('$type')).toBe('"author"')
    expect(url.searchParams.get('explain')).toBe('true')
    expect(requests[0]).toMatchObject({
      method: 'GET',
      body: undefined,
      canUseCdn: true,
      tag: 'vista.explain',
    })
  })

  it('posts the query and params as a body from the client’s URL size limit on, with explain in the URL', async () => {
    const {client, requests} = createClient({request: {result: [], explain: PLAN}})
    const under = {query: queryOfEncodedSize(QUERY_URL_SIZE_LIMIT - 1), params: {}}
    const at = {query: queryOfEncodedSize(QUERY_URL_SIZE_LIMIT), params: {}}
    const withParams = {
      query: '*[_type == $type]',
      params: {type: 'x'.repeat(QUERY_URL_SIZE_LIMIT)},
    }

    await fetchQueryPlan(client, under)
    expect(requests[0].method).toBe('GET')
    expect(new URL(requests[0].url, 'https://a.api.sanity.io').searchParams.get('query')).toBe(
      under.query,
    )

    for (const explained of [at, withParams]) {
      await fetchQueryPlan(client, explained)
      const request = requests[requests.length - 1]
      expect(request.method).toBe('POST')
      expect(request.body).toEqual(explained)
      expect(request.canUseCdn).toBe(true)
      expect(request.url).toBe('/data/query/test?explain=true')
    }
    expect(await fetchQueryPlan(client, at)).toBe(PLAN.trim())
  })

  it('rejects a response without a plan', async () => {
    const {client} = createClient({request: {result: []}})
    await expect(fetchQueryPlan(client, query)).rejects.toThrow('The response had no query plan')
  })
})

describe('explainQuery', () => {
  it('asks Agent Actions on the experimental API with the query, its params and the plan', async () => {
    const {client, prompts} = createClient({prompt: '  It fetches authors.\n\nNothing is slow.  '})
    expect(await explainQuery(client, query, PLAN)).toBe('It fetches authors.\n\nNothing is slow.')
    expect(prompts).toHaveLength(1)
    expect(prompts[0].apiVersion).toBe('vX')
    expect(prompts[0].request.instructionParams).toEqual({
      query: '*[_type == $type]',
      params: '{"type":"author"}',
      plan: PLAN,
      glossary: expect.stringContaining('FilterStep: filters rows in memory'),
    })
    // Template params, so the $ of a GROQ param (and the plan's $0 columns) is not read as one
    expect(prompts[0].request.instruction).toContain('$plan')
    expect(prompts[0].request.instruction).toContain('$glossary')
    expect(prompts[0].request.instruction).not.toContain('$0')
  })

  it('rejects an empty explanation', async () => {
    const {client} = createClient({prompt: '   '})
    await expect(explainQuery(client, query, PLAN)).rejects.toThrow(
      'The explanation came back empty',
    )
  })
})
