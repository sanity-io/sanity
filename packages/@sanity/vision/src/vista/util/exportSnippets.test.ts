import {describe, expect, it} from 'vitest'

import {buildExportSnippets, toQueryConstantName} from './exportSnippets'

const base = {
  query: '*[_type == "author" && _id == $id]{name}',
  params: {id: 'abc'},
  url: 'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*',
  projectId: 'abc',
  dataset: 'production',
  apiVersion: 'v2025-02-19',
  perspective: 'published' as const,
  variant: undefined,
  includeSourceMap: false,
}

describe('buildExportSnippets', () => {
  it('builds curl, @sanity/client and next-sanity snippets', () => {
    const [curl, client, nextSanity] = buildExportSnippets(base)

    expect(curl).toMatchObject({id: 'curl', language: 'bash'})
    expect(curl.code).toBe(
      [
        `curl 'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*' \\`,
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

  it('handles release stacks, variants, source maps and queries without params', () => {
    const [, client, nextSanity] = buildExportSnippets({
      ...base,
      query: 'count(*[`tick` in tags])',
      params: {},
      perspective: ['rSummer', 'drafts'],
      variant: 'french',
      apiVersion: 'vX',
      includeSourceMap: true,
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
