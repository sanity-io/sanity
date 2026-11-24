import {type TagStyle} from '@codemirror/language'
import {tags as t} from '@lezer/highlight'
import {describe, expect, it} from 'vitest'

import {encodeQueryString} from '../../util/encodeQueryString'
import {QUERY_URL_SIZE_LIMIT} from '../../util/queryRequestMethod'
import {
  buildExportSnippets,
  type ExportSnippetFile,
  type ExportSnippetInput,
} from './exportSnippets'
import {highlightSnippet} from './highlightSnippet'

// Named after what each tag is in the editors' table, so the expectations read as token kinds
const SPECS: TagStyle[] = [
  {tag: t.keyword, color: 'keyword'},
  {tag: [t.propertyName], color: 'property'},
  {tag: [t.function(t.variableName)], color: 'function'},
  {tag: [t.operator, t.compareOperator, t.logicOperator, t.arithmeticOperator], color: 'operator'},
  {tag: [t.number], color: 'number'},
  {tag: [t.atom, t.bool, t.special(t.variableName)], color: 'atom'},
  {tag: [t.string, t.special(t.string)], color: 'string'},
  {tag: [t.comment], color: 'comment'},
  {tag: [t.variableName], color: 'variable'},
]

const QUERY = `*[_type == "book" && defined(title)] | order(year desc)[0...10] {
  _id,
  "author": author->name,
  "classic": year < 1950
}`

function input(query: string): ExportSnippetInput {
  return {
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2025-01-01',
    query,
    params: {},
    url: `https://abc123.api.sanity.io/v2025-01-01/data/query/production${encodeQueryString(query, {})}&perspective=drafts`,
    perspective: ['drafts'],
    variant: undefined,
    includeSourceMap: false,
    useCdn: true,
  }
}

const INPUT = input(QUERY)

function kinds(file: ExportSnippetFile): Map<string, string | undefined> {
  const result = new Map<string, string | undefined>()
  for (const span of highlightSnippet(file, SPECS)) {
    const text = span.text.trim()
    if (text && !result.has(text)) {
      result.set(text, span.style === undefined ? undefined : SPECS[span.style].color)
    }
  }
  return result
}

const snippets = buildExportSnippets(INPUT, [
  'client',
  'curl',
  'next-sanity',
  'astro',
  'sveltekit',
  'nuxt',
])

describe('highlightSnippet', () => {
  it.each(
    snippets.flatMap((snippet) =>
      snippet.files.map((file) => [file.path ?? snippet.id, file] as const),
    ),
  )('joins back into the code of %s', (_path, file) => {
    const spans = highlightSnippet(file, SPECS)
    expect(spans.map((span) => span.text).join('')).toBe(file.code)
  })

  it.each(['client', 'next-sanity', 'sveltekit', 'astro', 'nuxt'] as const)(
    'highlights the GROQ of the %s query as GROQ',
    (id) => {
      const snippet = snippets.find((candidate) => candidate.id === id)!
      const file = snippet.files.find((candidate) => candidate.code.includes('"book"'))!
      const tokens = kinds(file)
      expect(tokens.get('"book"')).toBe('string')
      expect(tokens.get('order')).toBe('function')
      expect(tokens.get('1950')).toBe('number')
      expect(tokens.get('desc')).not.toBe('string')
      expect(tokens.get('_id')).not.toBe('string')
    },
  )

  it('keeps the rest of the code highlighted as JavaScript', () => {
    const file = snippets.find((snippet) => snippet.id === 'client')!.files[0]
    const tokens = kinds(file)
    expect(tokens.get('import')).toBe('keyword')
    expect(tokens.get("'@sanity/client'")).toBe('string')
    expect(tokens.get('`')).toBe('string')
  })

  it('highlights the GROQ of a curl GET query', () => {
    const file = snippets.find((snippet) => snippet.id === 'curl')!.files[0]
    const tokens = kinds(file)
    expect(tokens.get('curl')).toBe('keyword')
    expect(tokens.get('"book"')).toBe('string')
    expect(tokens.get('order')).toBe('function')
    expect(tokens.get('1950')).toBe('number')
  })

  it('leaves a curl query in a JSON body as a string', () => {
    const [file] = buildExportSnippets(input(`${QUERY}${' '.repeat(QUERY_URL_SIZE_LIMIT)}`), [
      'curl',
    ])[0].files
    expect(file.code).toContain('--data-raw')
    const spans = highlightSnippet(file, SPECS)
    const body = spans.find((span) => span.text.startsWith("'{"))
    expect(body && SPECS[body.style!].color).toBe('string')
  })

  it('leaves a curl query with a single quote in it as a string', () => {
    const [file] = buildExportSnippets(input(`*[title == "it's"]`), ['curl'])[0].files
    const spans = highlightSnippet(file, SPECS)
    expect(spans.map((span) => span.text).join('')).toBe(file.code)
    expect(spans.some((span) => span.text === 'title')).toBe(false)
  })
})
