import {type ClientPerspective} from '@sanity/client'

import {deriveTabTitle} from './tabTitle'

export type ExportSnippetId = 'curl' | 'client' | 'next-sanity'

export interface ExportSnippet {
  id: ExportSnippetId
  title: string
  language: 'bash' | 'typescript'
  code: string
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
}

function toTemplateLiteral(value: string): string {
  return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
}

function toSingleQuoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function toJsObject(value: Record<string, unknown>, indent = ''): string {
  const json = JSON.stringify(value, null, 2)
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

  const curl = [
    `curl ${toSingleQuoted(input.url)} \\`,
    `  -H "Authorization: Bearer $SANITY_API_TOKEN"`,
  ]

  const clientConfig = [
    `  projectId: ${toSingleQuoted(input.projectId)},`,
    `  dataset: ${toSingleQuoted(input.dataset)},`,
    `  apiVersion: ${toSingleQuoted(apiVersion)},`,
    `  useCdn: ${input.variant ? 'false' : 'true'},`,
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
    {id: 'curl', title: 'curl', language: 'bash', code: curl.join('\n')},
    {id: 'client', title: '@sanity/client', language: 'typescript', code: client.join('\n')},
    {id: 'next-sanity', title: 'next-sanity', language: 'typescript', code: nextSanity.join('\n')},
  ]
}
