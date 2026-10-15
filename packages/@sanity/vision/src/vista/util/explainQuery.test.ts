import {type PromptRequest} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type ExplainQueryClient, explainQuery, fetchQueryPlan} from './explainQuery'

const PLAN = 'Pipeline {\n  r1: StreamStep {\n    $0: Fetch {Filter: (_type == "author")}\n  }\n}\n'

function createClient(responses: {request?: unknown; prompt?: unknown}) {
  const requests: {url: string; tag: string}[] = []
  const prompts: {apiVersion: string; request: PromptRequest}[] = []
  const client: ExplainQueryClient = {
    getDataUrl: (operation, path = '') => `/data/${operation}/test${path}`,
    request: ({url, tag}) => {
      requests.push({url, tag})
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
    expect(requests[0].tag).toBe('vista.explain')
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
