import {describe, expect, it} from 'vitest'

import {encodeQueryString} from '../../util/encodeQueryString'
import {QUERY_URL_SIZE_LIMIT, queryRequestMethod} from '../../util/queryRequestMethod'
import {buildExportSnippets, toPostQueryUrl, toQueryConstantName} from './exportSnippets'

const base = {
  query: '*[_type == "author" && _id == $id]{name}',
  params: {id: 'abc'},
  url: 'https://abc.apicdn.sanity.io/v2025-02-19/data/query/production?query=*',
  projectId: 'abc',
  dataset: 'production',
  apiVersion: 'v2025-02-19',
  perspective: 'published' as const,
  variant: undefined,
  includeSourceMap: false,
  useCdn: true,
}

describe('buildExportSnippets', () => {
  it('builds curl, @sanity/client and next-sanity snippets', () => {
    const [curl, client, nextSanity] = buildExportSnippets(base)

    expect(curl).toMatchObject({id: 'curl', language: 'bash'})
    expect(curl.code).toBe(
      [
        `curl 'https://abc.apicdn.sanity.io/v2025-02-19/data/query/production?query=*' \\`,
        '  -H "Authorization: Bearer $SANITY_API_TOKEN"',
      ].join('\n'),
    )

    expect(client.code).toBe(
      [
        `import {createClient} from '@sanity/client'`,
        '',
        'const client = createClient({',
        `  projectId: 'abc',`,
        `  dataset: 'production',`,
        `  apiVersion: '2025-02-19',`,
        '  useCdn: true,',
        `  perspective: 'published',`,
        '})',
        '',
        'const query = `*[_type == "author" && _id == $id]{name}`',
        'const params = {',
        '  "id": "abc"',
        '}',
        '',
        'const result = await client.fetch(query, params)',
      ].join('\n'),
    )

    expect(nextSanity.code).toBe(
      [
        `import {defineQuery} from 'next-sanity'`,
        `import {sanityFetch} from '@/sanity/lib/live'`,
        '',
        'const AUTHOR_QUERY = defineQuery(`*[_type == "author" && _id == $id]{name}`)',
        '',
        'const {data} = await sanityFetch({',
        '  query: AUTHOR_QUERY,',
        '  params: {',
        '    "id": "abc"',
        '  },',
        `  perspective: 'published',`,
        '})',
      ].join('\n'),
    )
  })

  it('posts the query and params as a JSON body once they are too long for a URL, as the client does', () => {
    // Shell-quoted, as `'\''`, since the body is a shell word
    const query = `*[_type == 'author' && _id == $id]{name} // ${'x'.repeat(QUERY_URL_SIZE_LIMIT)}`
    const params = {id: "it's"}
    const search = encodeQueryString(query, params)
    const url = `https://abc.apicdn.sanity.io/v2025-02-19/data/query/production${search}&perspective=published&resultSourceMap=true`
    expect(queryRequestMethod(query, params)).toBe('POST')

    const [curl, client] = buildExportSnippets({...base, query, params, url})

    expect(curl.method).toBe('POST')
    expect(curl.code).toBe(
      [
        `curl 'https://abc.apicdn.sanity.io/v2025-02-19/data/query/production?perspective=published&resultSourceMap=true' \\`,
        '  -H "Authorization: Bearer $SANITY_API_TOKEN" \\',
        `  -H 'Content-Type: application/json' \\`,
        `  --data-raw '${JSON.stringify({query, params}).replace(/'/g, `'\\''`)}'`,
      ].join('\n'),
    )
    expect(
      JSON.parse(curl.code.split('--data-raw ')[1].slice(1, -1).replace(/'\\''/g, "'")),
    ).toEqual({query, params})
    // The client applies the rule itself when it runs the snippet
    expect(client.code).toContain('const result = await client.fetch(query, params)')
    expect(buildExportSnippets(base)[0].method).toBe('GET')
  })

  it('strips the query and params from the URL a POST goes to, keeping the options', () => {
    expect(
      toPostQueryUrl(
        'https://abc.api.sanity.io/v1/data/query/p?query=*&%24id=1&perspective=drafts&variant=fr',
      ),
    ).toBe('https://abc.api.sanity.io/v1/data/query/p?perspective=drafts&variant=fr')
    expect(toPostQueryUrl('https://abc.api.sanity.io/v1/data/query/p?query=*&$id=1')).toBe(
      'https://abc.api.sanity.io/v1/data/query/p',
    )
  })

  it('handles release stacks, variants, source maps and queries without params', () => {
    const [, client, nextSanity] = buildExportSnippets({
      ...base,
      query: 'count(*[`tick` in tags])',
      params: {},
      perspective: ['rSummer', 'drafts'],
      variant: 'french',
      apiVersion: 'vX',
      includeSourceMap: true,
      // A stack keeps the query on the API
      useCdn: false,
    })

    expect(client.code).toContain(`  apiVersion: 'X',`)
    expect(client.code).toContain('  useCdn: false,')
    expect(client.code).toContain(`  perspective: ['rSummer', 'drafts'],`)
    expect(client.code).toContain(`  variant: 'french',`)
    expect(client.code).toContain('const query = `count(*[\\`tick\\` in tags])`')
    expect(client.code).toContain(
      'const result = await client.fetch(query, {}, {filterResponse: false, resultSourceMap: true})',
    )
    expect(client.code).not.toContain('const params')

    expect(nextSanity.code).not.toContain('params:')
    expect(nextSanity.code).toContain(`  perspective: ['rSummer', 'drafts'],`)
    expect(nextSanity.code).toContain(`  variant: 'french',`)
  })

  it('parses params holding a __proto__ key from JSON instead of writing a literal', () => {
    const params = JSON.parse('{"id": "a", "__proto__": {"polluted": true}}') as Record<
      string,
      unknown
    >
    const [, client, nextSanity] = buildExportSnippets({...base, params})

    const expected = `JSON.parse('{"id":"a","__proto__":{"polluted":true}}')`
    expect(client.code).toContain(`const params = ${expected}`)
    expect(nextSanity.code).toContain(`  params: ${expected},`)
    // A plain object stays a literal
    expect(buildExportSnippets(base)[1].code).toContain('const params = {\n  "id": "abc"\n}')
  })

  it('leaves the unsupported raw perspective out of the next-sanity snippet and says so', () => {
    const [, client, nextSanity] = buildExportSnippets({...base, perspective: 'raw'})

    expect(client.code).toContain(`  perspective: 'raw',`)
    expect(nextSanity.code).not.toContain('perspective:')
    expect(nextSanity.code).toContain("// sanityFetch does not support the 'raw' perspective")
  })

  it('derives constant names from the query', () => {
    expect(toQueryConstantName('*[_type == "author"]')).toBe('AUTHOR_QUERY')
    expect(toQueryConstantName('*[_type in ["post", "page"]]')).toBe('POST_PAGE_QUERY')
    expect(toQueryConstantName('count(*)')).toBe('COUNT_QUERY')
    expect(toQueryConstantName('')).toBe('QUERY')
    expect(toQueryConstantName('123')).toBe('QUERY')
  })
})
