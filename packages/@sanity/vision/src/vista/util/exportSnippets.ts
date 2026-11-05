import {type ClientPerspective} from '@sanity/client'

import {
  type QueryRequestMethod,
  queryRequestMethod,
  splitQuerySearchParams,
} from '../../util/queryRequestMethod'
import {deriveTabTitle} from './tabTitle'

export type ExportSnippetId = 'curl' | 'client' | 'next-sanity'

export interface ExportSnippet {
  id: ExportSnippetId
  title: string
  language: 'bash' | 'typescript'
  code: string
  /**
   * How the curl snippet sends the query: in the URL, or as a JSON body once the query and
   * params are too long for one, as `@sanity/client` (which the other snippets call) does on
   * its own. The other snippets leave it unset.
   */
  method?: QueryRequestMethod
}

export interface ExportSnippetInput {
  query: string
  params: Record<string, unknown>
  url: string
  projectId: string
  dataset: string
  /** With or without the `v` prefix */
  apiVersion: string
  perspective: ClientPerspective | undefined
  variant: string | undefined
  includeSourceMap: boolean
  /** The query went through the API CDN */
  useCdn: boolean
}

function toTemplateLiteral(value: string): string {
  return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
}

function toSingleQuoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/** A shell word in single quotes, where only a quote needs escaping, as `'\''` */
function toShellQuoted(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/**
 * The URL a `POST` of the query goes to: the request URL without the query and its params,
 * which travel in the body, keeping the options (perspective, variant, source map) in it as
 * `@sanity/client` keeps them
 */
export function toPostQueryUrl(url: string): string {
  const parsed = new URL(url)
  parsed.search = splitQuerySearchParams(parsed.searchParams).options.toString()
  return parsed.href
}

/**
 * JSON is a valid object literal, except that a `__proto__` key in a literal sets the object's
 * prototype instead of a property; such params are parsed from a string so the snippet sends
 * what Vision sent.
 */
function toJsObject(value: Record<string, unknown>, indent = ''): string {
  const json = JSON.stringify(value, null, 2)
  if (/"__proto__"\s*:/.test(json)) {
    return `JSON.parse(${toSingleQuoted(JSON.stringify(value))})`
  }
  return json.replace(/\n/g, `\n${indent}`)
}

function toPerspectiveLiteral(perspective: ClientPerspective): string {
  if (Array.isArray(perspective)) {
    return `[${perspective.map((entry) => toSingleQuoted(entry)).join(', ')}]`
  }
  return toSingleQuoted(perspective)
}

/** `AUTHOR_QUERY` for `*[_type == "author"]`, `QUERY` when nothing better can be derived */
export function toQueryConstantName(query: string): string {
  const title = deriveTabTitle(query) || ''
  const words = title
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
  if (words.length === 0 || /^\d/.test(words[0])) {
    return 'QUERY'
  }
  return `${words.join('_').toUpperCase()}_QUERY`
}

export function buildExportSnippets(input: ExportSnippetInput): ExportSnippet[] {
  const hasParams = Object.keys(input.params).length > 0
  const apiVersion = input.apiVersion.replace(/^v/, '')
  const constantName = toQueryConstantName(input.query)

  // The client's own rule: a query and params too long for a URL go in a JSON body, and the
  // options stay in the URL. `@sanity/client` applies it inside `fetch`, so only curl spells it out
  const method = queryRequestMethod(input.query, input.params)
  const curl =
    method === 'GET'
      ? [`curl ${toShellQuoted(input.url)} \\`, `  -H "Authorization: Bearer $SANITY_API_TOKEN"`]
      : [
          `curl ${toShellQuoted(toPostQueryUrl(input.url))} \\`,
          `  -H "Authorization: Bearer $SANITY_API_TOKEN" \\`,
          `  -H 'Content-Type: application/json' \\`,
          `  --data-raw ${toShellQuoted(JSON.stringify({query: input.query, params: input.params}))}`,
        ]

  const clientConfig = [
    `  projectId: ${toSingleQuoted(input.projectId)},`,
    `  dataset: ${toSingleQuoted(input.dataset)},`,
    `  apiVersion: ${toSingleQuoted(apiVersion)},`,
    `  useCdn: ${input.useCdn ? 'true' : 'false'},`,
  ]
  if (input.perspective !== undefined) {
    clientConfig.push(`  perspective: ${toPerspectiveLiteral(input.perspective)},`)
  }
  if (input.variant) {
    clientConfig.push(`  variant: ${toSingleQuoted(input.variant)},`)
  }

  const fetchArgs = ['query', hasParams ? 'params' : '{}']
  if (input.includeSourceMap) {
    fetchArgs.push('{filterResponse: false, resultSourceMap: true}')
  }

  const client = [
    `import {createClient} from '@sanity/client'`,
    '',
    'const client = createClient({',
    ...clientConfig,
    '})',
    '',
    `const query = ${toTemplateLiteral(input.query)}`,
    ...(hasParams ? [`const params = ${toJsObject(input.params)}`] : []),
    '',
    `const result = await client.fetch(${fetchArgs.join(', ')})`,
  ]

  // Sanity Live takes every perspective but the legacy `raw`, which it leaves to its own default
  const livePerspective =
    input.perspective === undefined || input.perspective === 'raw' ? undefined : input.perspective
  const nextSanity = [
    `import {defineQuery} from 'next-sanity'`,
    `import {sanityFetch} from '@/sanity/lib/live'`,
    '',
    `const ${constantName} = defineQuery(${toTemplateLiteral(input.query)})`,
    '',
    ...(input.perspective === 'raw'
      ? [
          "// sanityFetch does not support the 'raw' perspective this query was run with; it",
          "// uses its own default ('published', or 'drafts' in draft mode)",
        ]
      : []),
    'const {data} = await sanityFetch({',
    `  query: ${constantName},`,
    ...(hasParams ? [`  params: ${toJsObject(input.params, '  ')},`] : []),
    ...(livePerspective === undefined
      ? []
      : [`  perspective: ${toPerspectiveLiteral(livePerspective)},`]),
    ...(input.variant ? [`  variant: ${toSingleQuoted(input.variant)},`] : []),
    '})',
  ]

  return [
    {id: 'curl', title: 'curl', language: 'bash', code: curl.join('\n'), method},
    {id: 'client', title: '@sanity/client', language: 'typescript', code: client.join('\n')},
    {id: 'next-sanity', title: 'next-sanity', language: 'typescript', code: nextSanity.join('\n')},
  ]
}
