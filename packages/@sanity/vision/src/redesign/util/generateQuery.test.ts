import {type PromptRequest} from '@sanity/client'
import {parse} from 'groq-js'
import {describe, expect, it, vi} from 'vitest'

import {
  describeDiagnostics,
  editQuery,
  fitQueryToDocumentList,
  fixQueryLint,
  type GenerateQueryClient,
  generatedQueryComment,
  generateQuery,
  GenerateQueryError,
  improveQuery,
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

describe('generateQuery for the Documents view', () => {
  const listFields =
    'The row attributes of those document types, from their previews:\n- author: "title": lastName; "media": avatar'

  it('asks for the row attributes in a list of documents, with the attributes of the requested types', async () => {
    const {client, prompts} = createClient({replies: [{query: '*[_type == "author"]', params: {}}]})

    await generateQuery({request, schema, listFields, client})

    expect(prompts[0].instructionParams).toMatchObject({request, schema, listFields})
    const instruction = prompts[0].instruction
    expect(instruction).toContain('When the request asks for a list of documents')
    expect(instruction).toContain('_id, _type, "title"')
    expect(instruction).toContain('"subtitle"')
    expect(instruction).toContain('"media"')
    // Templated, so a $ in a type's field paths is not read as a param
    expect(instruction).toContain('$listFields')
    expect(instruction).not.toContain(listFields)
  })

  it('tells the model to leave counts, single documents and other shapes alone', async () => {
    const {client, prompts} = createClient({replies: [{query: 'count(*)', params: {}}]})

    await generateQuery({request: 'How many authors are there?', schema, client})

    const instruction = prompts[0].instruction
    expect(instruction).toContain('Leave the row attributes out of every other kind of query')
    expect(instruction).toContain('a count or another number')
    expect(instruction).toContain('a single document')
    expect(instruction).toContain('an object of aggregates or groups')
  })

  it('has the model pick the attributes from the fields when no previews are known', async () => {
    const {client, prompts} = createClient({replies: [{query: 'count(*)', params: {}}]})

    await generateQuery({request, schema, client})

    expect(prompts[0].instructionParams?.listFields).toBe(
      'Pick the row attributes from the fields of the document types.',
    )
  })

  it('leaves edits to the change the user describes', async () => {
    const {client, prompts} = createClient({replies: [{query: 'count(*)', params: {}}]})

    await editQuery({
      request: 'Count them',
      query: '*[_type == "author"]',
      params: {},
      schema,
      client,
    })

    expect(prompts[0].instruction).not.toContain('$listFields')
    expect(prompts[0].instruction).not.toContain('"subtitle"')
  })
})

describe('fitQueryToDocumentList', () => {
  const current = '// The authors\n*[_type == $type]{name}'
  const fitted =
    '// The authors\n*[_type == $type]{_id, _type, "title": name, "media": avatar, name}'
  const result = 'An array of 3 documents, none of which has _id.'
  const listFields =
    'The row attributes of those document types, from their previews:\n- author: "title": name; "media": avatar'

  it('sends the query, its params, what it returns and the row attributes, and checks the result', async () => {
    const {client, prompts, checks} = createClient({
      replies: [{query: fitted, params: {type: 'author'}}],
    })

    expect(
      await fitQueryToDocumentList({
        query: current,
        params: {type: 'author'},
        result,
        listFields,
        schema,
        client,
      }),
    ).toEqual({query: fitted, params: {type: 'author'}, title: undefined})
    expect(prompts[0]).toMatchObject({
      format: 'json',
      instructionParams: {
        query: current,
        params: '{"type":"author"}',
        result,
        listFields,
        schema,
      },
    })
    expect(checks).toEqual([{query: `select(false => (\n${fitted}\n))`, params: {type: 'author'}}])
  })

  it('keeps the selection and the comments, and lists a single document as a list of one', async () => {
    const {client, prompts} = createClient({replies: [{query: fitted, params: {type: 'author'}}]})

    await fitQueryToDocumentList({query: current, params: {}, result, schema, client})

    const instruction = prompts[0].instruction
    expect(instruction).toContain('Keep what the query selects')
    expect(instruction).toContain('a list of one')
    expect(instruction).toMatch(/comment/i)
    expect(instruction).toContain('"media"')
    expect(prompts[0].instructionParams?.listFields).toBe(
      'Pick the row attributes from the fields of the document types.',
    )
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

  it('tells the model to keep the comments of the query, on every attempt', async () => {
    const {client, prompts} = createClient({
      replies: [
        {query: '*[_type == $type] | sort_by(.lastName)', params: {type: 'author'}},
        {query: `${current} | order(lastName asc)`, params: {type: 'author'}},
      ],
      rejections: {sort_by: queryError('unexpected token "."')},
    })

    await editQuery({
      query: `${current}\n// only published authors`,
      params: {type: 'author'},
      request: 'Sort by last name',
      schema,
      client,
    })
    for (const prompt of prompts) {
      expect(prompt.instruction).toContain('Keep every comment')
      expect(prompt.instruction).toContain('// Generated with the prompt:')
      expect(prompt.instruction).toContain('never delete one')
    }
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
    expect(prompts[0].instruction).toContain('Keep every comment')
    expect(prompts[0].instruction).toContain('never delete one')
    expect(checks).toEqual([{query: `select(false => (\n${fixed}\n))`, params: {type: 'post'}}])
    expect(prompts[0].instructionParams?.target).toBe('The problems are in the query.')
  })

  it('says when the problems are in the values of the params', async () => {
    const query = '*[_type == $type]'
    const {client, prompts} = createClient({replies: [{query, params: {type: 'post'}}]})
    const param: QueryLintFinding = {
      from: 11,
      to: 16,
      line: 1,
      column: 12,
      severity: 'warning',
      message: '`$type` is `"psot"`, but the schema has no document type named `psot`.',
      source: 'vision/unknown-type',
      param: {name: 'type', path: [], value: 'psot'},
    }

    await fixQueryLint({
      query,
      params: {type: 'psot'},
      diagnostics: [param],
      target: 'params',
      schema,
      client,
    })
    expect(prompts[0].instruction).toContain('$target')
    expect(prompts[0].instructionParams).toMatchObject({
      target: expect.stringContaining('values of its parameters'),
      diagnostics:
        '- Params, the value of $type (warning, vision/unknown-type): `$type` is `"psot"`, but the schema has no document type named `psot`.',
    })
  })
})

describe('improveQuery', () => {
  it('sends the query, its params and the suggestions as a list, and checks the improved query', async () => {
    const current =
      '// Generated with the prompt: posts\n*[_type == $type && references(*[_type == "author"]._id)]'
    const improved = '// Generated with the prompt: posts\n*[_type == $type && defined(author)]'
    const {client, prompts, checks} = createClient({
      replies: [{query: improved, params: {type: 'post'}}],
    })

    expect(
      await improveQuery({
        query: current,
        params: {type: 'post'},
        suggestions: ['Check `defined(author)` instead of the subquery.', 'Add a slice.'],
        schema,
        client,
      }),
    ).toEqual({query: improved, params: {type: 'post'}, title: undefined})
    expect(prompts[0]).toMatchObject({
      format: 'json',
      instructionParams: {
        query: current,
        params: '{"type":"post"}',
        suggestions: '- Check `defined(author)` instead of the subquery.\n- Add a slice.',
        schema,
      },
    })
    expect(prompts[0].instruction).toContain('$suggestions')
    expect(prompts[0].instruction).not.toContain('defined(author)')
    expect(prompts[0].instruction).toContain('same data in the same shape')
    expect(prompts[0].instruction).toContain('Keep every comment')
    expect(checks).toEqual([{query: `select(false => (\n${improved}\n))`, params: {type: 'post'}}])
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
