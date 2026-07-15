// @vitest-environment node
/**
 * GROQ endpoint coverage (data.ts handleQuery and its two helpers:
 * `rewriteUnsupportedGroq` and `parseWithParams`), exercised through the
 * real HTTP surface. Pins the structure tool's findability rewrite, the
 * param-substitution retry for parameterized slices, and the 400
 * (mock-drift visibility) for queries groq-js cannot evaluate.
 */
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest'

import {createMockApi, type MockApiServer} from '../createServer'

const PORT = 43122

describe('mock GROQ endpoint (handleQuery)', () => {
  let mock: MockApiServer

  beforeAll(async () => {
    mock = createMockApi({port: PORT, projectId: 'benchexp', dataset: 'bench'})
    await mock.listen()
  })

  afterEach(() => {
    mock.store.reset()
    mock.ledger.reset()
  })

  afterAll(async () => {
    await mock.close()
  })

  async function query(
    groq: string,
    params: Record<string, unknown> = {},
  ): Promise<{status: number; body: any}> {
    const response = await fetch(`http://127.0.0.1:${PORT}/v2025-02-19/data/query/bench`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({query: groq, params}),
    })
    return {status: response.status, body: await response.json()}
  }

  it('retries a parameterized slice (groq-js rejects non-constant bounds) with params substituted', async () => {
    mock.store.seed([
      {_id: 'a', _type: 'thing'},
      {_id: 'b', _type: 'thing'},
      {_id: 'c', _type: 'thing'},
    ])
    // The structure list query shape: strict parse fails with "slicing must
    // use constant numbers", so parseWithParams substitutes `$__limit`
    const {status, body} = await query(`*[_type == $type] | order(_id) [0...$__limit]{_id}`, {
      type: 'thing',
      __limit: 2,
    })
    expect(status).toBe(200)
    expect(body.result).toEqual([{_id: 'a'}, {_id: 'b'}])
  })

  it("substitutes param values containing replacement-special sequences ($&, $') literally", async () => {
    // `$&` and `$'` are special in String.replace *replacement strings* —
    // the substitution must use a replacer function so a `$` in a param
    // value cannot expand to the matched text and corrupt the query
    const needle = `a$&b$'c$$d`
    mock.store.seed([
      {_id: 'match', _type: 'thing', stringField: needle},
      {_id: 'other', _type: 'thing', stringField: 'plain'},
    ])
    const {status, body} = await query(`*[stringField == $needle][0...$__limit]{_id}`, {
      needle,
      __limit: 10,
    })
    expect(status).toBe(200)
    expect(body.result).toEqual([{_id: 'match'}])
  })

  it('leaves param-shaped text inside string literals alone on the strict-parse path', async () => {
    // No parameterized slice → strict parse succeeds → no textual
    // substitution ever happens, so `"$needle"` stays a literal string
    mock.store.seed([
      {_id: 'literal', _type: 'thing', stringField: '$needle'},
      {_id: 'value', _type: 'thing', stringField: 'x'},
    ])
    const {status, body} = await query(`*[stringField == "$needle"]{_id}`, {needle: 'x'})
    expect(status).toBe(200)
    expect(body.result).toEqual([{_id: 'literal'}])
  })

  it('surfaces the substitution-inside-string-literal limitation as a 400, not silently wrong results', async () => {
    // Known limitation of the textual retry: with a parameterized slice in
    // the query, `$needle` inside a string literal is substituted too,
    // producing `""x""` — an invalid query. Per the mock-drift policy this
    // must fail loudly (400 → console noise) rather than match the wrong
    // documents; if this starts passing, the substitution got smarter and
    // the test should be updated to pin the new behavior.
    mock.store.seed([{_id: 'literal', _type: 'thing', stringField: '$needle'}])
    const {status, body} = await query(`*[stringField == "$needle"][0...$__limit]{_id}`, {
      needle: 'x',
      __limit: 10,
    })
    expect(status).toBe(400)
    expect(body.error.type).toBe('queryParseError')
  })

  it('rewrites the structure findability predicate (text::query) to match-all', async () => {
    mock.store.seed([
      {_id: 'a', _type: 'thing', stringField: 'one'},
      {_id: 'b', _type: 'thing', stringField: 'two'},
    ])
    // The structure tool's list/search query shape — groq-js cannot evaluate
    // `text::query()`, so the mock rewrites the predicate to `true` (what an
    // empty search returns from the real API)
    const {status, body} = await query(
      `*[_type == $type && [@, _id] match text::query($__query)] | order(_id) {_id}`,
      {type: 'thing', __query: ''},
    )
    expect(status).toBe(200)
    expect(body.result).toEqual([{_id: 'a'}, {_id: 'b'}])
  })

  it('answers 400 for unsupported queries the rewrite does not cover (mock-drift visibility)', async () => {
    mock.store.seed([{_id: 'a', _type: 'thing', title: 'x'}])
    // `text::query()` in any other shape is NOT rewritten: groq-js parses it
    // but throws "not implemented" at evaluation — the 400 is the loud
    // mock-drift signal promised by the rewriteUnsupportedGroq docstring
    const {status, body} = await query(`*[title match text::query($q)]`, {q: 'x'})
    expect(status).toBe(400)
    expect(body.error.type).toBe('queryParseError')
    expect(body.error.description).toMatch(/not implemented/)
  })
})
