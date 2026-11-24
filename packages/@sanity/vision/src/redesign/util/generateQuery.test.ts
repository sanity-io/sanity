import {type PromptRequest} from '@sanity/client'
import {parse} from 'groq-js'
import {describe, expect, it, vi} from 'vitest'

import {
  describeDiagnostics,
  editQuery,
  fixQueryLint,
  type GenerateQueryClient,
  generatedQueryComment,
  generateQuery,
  GenerateQueryError,
  MAX_GENERATE_ATTEMPTS,
} from './generateQuery'
import {type QueryLintFinding} from './groqLint'

/** A rejected query as `@sanity/client` reports it: the API's error object on `details` */
function queryError(description: string) {
  return Object.assign(new Error(`GROQ query parse error: ${description}`), {
    details: {type: 'queryParseError', description},
  })
}

function createClient(options: {replies: unknown[]; rejections?: Record<string, Error>}) {
  const prompts: PromptRequest[] = []
  const checks: {query: string; params: Record<string, unknown>}[] = []
  const apiVersions: string[] = []
  const client: GenerateQueryClient = {
    withConfig: ({apiVersion}) => {
      apiVersions.push(apiVersion)
      return {
        agent: {
          action: {
            prompt: async (request) => {
              prompts.push(request)
              return options.replies.shift()
            },
          },
        },
      }
    },
    fetch: async (query, params) => {
      checks.push({query, params})
      const rejection = Object.entries(options.rejections ?? {}).find(([part]) =>
        query.includes(part),
      )
      if (rejection) throw rejection[1]
      return null
    },
  }
  return {client, prompts, checks, apiVersions}
}

const request = 'The 10 most recent authors by last name'
const schema = '- author: firstName: string, lastName: string'

describe('generateQuery', () => {
  it('prompts on the experimental API and checks the query without running it', async () => {
    const {client, prompts, checks, apiVersions} = createClient({
      replies: [
        {
          query: '*[_type == $type] | order(_createdAt desc)[0...10] | order(lastName asc)',
          params: {type: 'author'},
          title: 'Recent authors',
        },
      ],
    })
    const onAttempt = vi.fn()

    expect(await generateQuery({request, schema, client, onAttempt})).toEqual({
      query: '*[_type == $type] | order(_createdAt desc)[0...10] | order(lastName asc)',
      params: {type: 'author'},
      title: 'Recent authors',
    })
    expect(apiVersions).toEqual(['vX'])
    expect(onAttempt.mock.calls).toEqual([[1]])
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toMatchObject({format: 'json', instructionParams: {request, schema}})
    // The request and the schema are template params, so a $ in them is not read as one
    expect(prompts[0].instruction).toContain('$request')
    expect(prompts[0].instruction).toContain('JSON')
    expect(checks).toEqual([
      {
        query:
          'select(false => (\n*[_type == $type] | order(_createdAt desc)[0...10] | order(lastName asc)\n))',
        params: {type: 'author'},
      },
    ])
  })

  it('retries with the error the Content Lake gave for a rejected query', async () => {
    const {client, prompts} = createClient({
      replies: [
        {query: '*[_type == "author"] | sort_by(.lastName)', params: {}},
        {query: '*[_type == "author"] | order(lastName asc)', params: {}, title: 'Authors'},
      ],
      rejections: {sort_by: queryError('unexpected token ".", expected expression')},
    })
    const onAttempt = vi.fn()

    expect(await generateQuery({request, schema, client, onAttempt})).toMatchObject({
      query: '*[_type == "author"] | order(lastName asc)',
    })
    expect(onAttempt.mock.calls).toEqual([[1], [2]])
    expect(prompts[1].instruction).toContain('$previous')
    const previous = String(prompts[1].instructionParams?.previous)
    expect(previous).toContain('sort_by(.lastName)')
    expect(previous).toContain('Error: unexpected token ".", expected expression')
  })

  it('gives up after the last attempt, keeping it so it can be fixed by hand', async () => {
    const replies = Array.from({length: MAX_GENERATE_ATTEMPTS}, () => ({
      query: '*[_type == "author"] limit 10',
      params: {},
    }))
    const {client, prompts} = createClient({
      replies,
      rejections: {limit: queryError('unexpected token "limit"')},
    })

    const error = await generateQuery({request, schema, client}).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(GenerateQueryError)
    expect(error).toMatchObject({
      message: 'unexpected token "limit"',
      lastAttempt: {query: '*[_type == "author"] limit 10', params: {}, title: undefined},
    })
    expect(prompts).toHaveLength(MAX_GENERATE_ATTEMPTS)
  })

  it('asks again when a reply has no query, and drops params and titles that do not fit', async () => {
    const {client, prompts} = createClient({
      replies: [
        {params: {}},
        {query: ' *[_type == "book"] ', params: ['not', 'an', 'object'], title: 'x'.repeat(61)},
      ],
    })

    expect(await generateQuery({request, schema, client})).toEqual({
      query: '*[_type == "book"]',
      params: {},
      title: undefined,
    })
    expect(String(prompts[1].instructionParams?.previous)).toContain('The reply had no query')
  })

  it('rejects right away when the prompt itself fails', async () => {
    const client: GenerateQueryClient = {
      withConfig: () => ({
        agent: {
          action: {
            prompt: () =>
              Promise.reject(new Error('Agent Actions are not enabled for this project')),
          },
        },
      }),
      fetch: () => Promise.resolve(null),
    }
    await expect(generateQuery({request, schema, client})).rejects.toThrow(
      'Agent Actions are not enabled for this project',
    )
  })

  it('stops when aborted between attempts', async () => {
    const controller = new AbortController()
    const {client, prompts} = createClient({
      replies: [{query: '*[_type == "author"] | .name', params: {}}],
      rejections: {'.name': queryError('unexpected token "."')},
    })
    const fetch = client.fetch
    client.fetch = async (...args) => {
      controller.abort()
      return fetch(...args)
    }

    await expect(
      generateQuery({request, schema, client, signal: controller.signal}),
    ).rejects.toMatchObject({name: 'AbortError'})
    expect(prompts).toHaveLength(1)
  })
})

describe('editQuery', () => {
  const current = '// Generated with the prompt: authors\n*[_type == $type]'

  it('sends the current query, its params and the change, and checks the edited query', async () => {
    const edited = '// Generated with the prompt: authors\n*[_type == $type] | order(lastName asc)'
    const {client, prompts, checks, apiVersions} = createClient({
      replies: [{query: edited, params: {type: 'author'}}],
    })

    expect(
      await editQuery({
        query: current,
        params: {type: 'author'},
        request: 'Sort by last name',
        schema,
        client,
      }),
    ).toEqual({query: edited, params: {type: 'author'}, title: undefined})
    expect(apiVersions).toEqual(['vX'])
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toMatchObject({
      format: 'json',
      instructionParams: {
        query: current,
        params: '{"type":"author"}',
        request: 'Sort by last name',
        schema,
      },
    })
    // Everything the user wrote goes in as template params, never into the instruction itself
    expect(prompts[0].instruction).toContain('$query')
    expect(prompts[0].instruction).toContain('$request')
    expect(prompts[0].instruction).not.toContain('Sort by last name')
    expect(checks).toEqual([{query: `select(false => (\n${edited}\n))`, params: {type: 'author'}}])
  })

  it('retries a rejected edit with the error', async () => {
    const {client, prompts} = createClient({
      replies: [
        {query: '*[_type == $type] | sort_by(.lastName)', params: {type: 'author'}},
        {query: '*[_type == $type] | order(lastName asc)', params: {type: 'author'}},
      ],
      rejections: {sort_by: queryError('unexpected token "."')},
    })

    expect(
      await editQuery({
        query: current,
        params: {type: 'author'},
        request: 'Sort by last name',
        schema,
        client,
      }),
    ).toMatchObject({query: '*[_type == $type] | order(lastName asc)'})
    expect(prompts[1].instruction).toContain('$query')
    expect(prompts[1].instruction).toContain('$previous')
    expect(prompts[1].instructionParams).toMatchObject({query: current})
  })
})

describe('fixQueryLint', () => {
  const diagnostics: QueryLintFinding[] = [
    {
      from: 21,
      to: 30,
      line: 2,
      column: 1,
      severity: 'warning',
      message: 'Use `order()` before slicing',
      source: 'groq-lint/slice-before-order',
    },
    {
      from: 0,
      to: 1,
      line: 1,
      column: 1,
      severity: 'error',
      message: 'Unexpected token',
      source: undefined,
    },
  ]

  it('sends the query, its params and the diagnostics, and checks the fixed query', async () => {
    const fixed = '*[_type == $type] | order(_createdAt desc)[0...10]'
    const {client, prompts, checks} = createClient({
      replies: [{query: fixed, params: {type: 'post'}}],
    })

    expect(
      await fixQueryLint({
        query: '*[_type == $type][0...10]\n| order(_createdAt desc)',
        params: {type: 'post'},
        diagnostics,
        schema,
        client,
      }),
    ).toEqual({query: fixed, params: {type: 'post'}, title: undefined})
    expect(prompts[0]).toMatchObject({
      format: 'json',
      instructionParams: {
        query: '*[_type == $type][0...10]\n| order(_createdAt desc)',
        params: '{"type":"post"}',
        diagnostics:
          '- Line 2, column 1 (warning, groq-lint/slice-before-order): Use `order()` before slicing\n' +
          '- Line 1, column 1 (error): Unexpected token',
        schema,
      },
    })
    expect(prompts[0].instruction).toContain('$diagnostics')
    expect(prompts[0].instruction).not.toContain('Unexpected token')
    expect(checks).toEqual([{query: `select(false => (\n${fixed}\n))`, params: {type: 'post'}}])
  })
})

describe('describeDiagnostics', () => {
  it('lists nothing for no diagnostics', () => {
    expect(describeDiagnostics([])).toBe('')
  })
})

describe('generatedQueryComment', () => {
  it('names the prompt in a GROQ line comment', () => {
    expect(generatedQueryComment('The 10 most recent authors')).toBe(
      '// Generated with the prompt: The 10 most recent authors\n',
    )
  })

  it('writes every line break as an escape, so the comment stays one line', () => {
    const comment = generatedQueryComment('a\r\nb\rc\nd\u2028e\u2029f')
    expect(comment).toBe('// Generated with the prompt: a\\r\\nb\\rc\\nd\\u2028e\\u2029f\n')
    expect(comment.slice(0, -1)).not.toMatch(/[\r\n\u2028\u2029]/)
  })

  it('leaves the query after it intact', () => {
    const query = '*[_type == "author"]{name}'
    for (const prompt of ['authors', 'line one\nline two', 'a\u2028b', 'ends with a break\r\n']) {
      expect(parse(`${generatedQueryComment(prompt)}${query}`)).toEqual(parse(query))
    }
  })
})
