import {type ClientPerspective} from '@sanity/client'

import {isApiVersionBelow} from '../../util/compareApiVersion'
import {
  type QueryRequestMethod,
  queryRequestMethod,
  splitQuerySearchParams,
} from '../../util/queryRequestMethod'
import {type VisionExportSnippetId} from '../store/types'

export type ExportSnippetId = VisionExportSnippetId

/** The package (or tool) each snippet is written for, as its tab and settings name it */
export const EXPORT_SNIPPET_TITLES: Record<ExportSnippetId, string> = {
  'client': '@sanity/client',
  'curl': 'curl',
  'next-sanity': 'next-sanity',
  'astro': '@sanity/astro',
  'sveltekit': '@sanity/sveltekit',
  'nuxt': '@nuxtjs/sanity',
}

/**
 * The grammar a file is highlighted with. The studio registers bash, JavaScript, JSX and
 * TypeScript only, so `.tsx`, `.astro` and `.vue` files are highlighted as JSX, whose tags and
 * expressions they share.
 */
export type ExportSnippetLanguage = 'bash' | 'javascript' | 'jsx' | 'typescript'

export interface ExportSnippetFile {
  /** Where the file goes in the app; unset for a snippet that is not tied to a file */
  path?: string
  language: ExportSnippetLanguage
  code: string
}

export interface ExportSnippet {
  id: ExportSnippetId
  title: string
  files: ExportSnippetFile[]
  /** The snippet reads an API token from `SANITY_API_TOKEN`, which the perspective needs */
  usesToken: boolean
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
  /** `undefined` is the API default, which depends on the API version */
  perspective: ClientPerspective | undefined
  variant: string | undefined
  includeSourceMap: boolean
  /**
   * The query is meant for the API CDN. Perspectives the CDN cannot serve (drafts, releases) go
   * to the API whatever this says, as the clients the snippets configure do too.
   */
  useCdn: boolean
}

/** The date from which the API answers with published documents when no perspective is given */
const PUBLISHED_DEFAULT_API_VERSION = '2025-02-19'

/** The width snippets are laid out for, and comments wrapped at */
const LINE_WIDTH = 80

const TOKEN_ENV = 'SANITY_API_TOKEN'

const TYPE_FILTER = /_type\s*==\s*(["'])([^"']+)\1/
const TYPE_IN_FILTER = /_type\s+in\s+\[([^\]]+)\]/
const ID_FILTER = /_id\s*==\s*(["'])([^"']+)\1/
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function toTemplateLiteral(value: string): string {
  return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``
}

/** A string literal in single quotes, or double quotes when that needs fewer escapes */
function toSingleQuoted(value: string): string {
  // JSON's escapes cover every character a string literal cannot hold as is
  const json = JSON.stringify(value)
  const singles = value.split("'").length - 1
  const doubles = value.split('"').length - 1
  if (singles > doubles) return json
  return `'${json.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`
}

/** A shell word in single quotes, where only a quote needs escaping, as `'\''` */
function toShellQuoted(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function toPropertyKey(key: string): string {
  // A `__proto__` key in a literal sets the prototype; a computed key makes it a property
  if (key === '__proto__') return `['__proto__']`
  return IDENTIFIER.test(key) ? key : toSingleQuoted(key)
}

function toInlineLiteral(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(toInlineLiteral).join(', ')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, entry]) => entry !== undefined)
    return `{${entries.map(([key, entry]) => `${toPropertyKey(key)}: ${toInlineLiteral(entry)}`).join(', ')}}`
  }
  if (typeof value === 'string') return toSingleQuoted(value)
  return JSON.stringify(value) ?? 'null'
}

/**
 * A JSON value (params) as a JavaScript literal in the repository's style: single quotes, bare
 * keys, on one line when short and one entry per line otherwise. `indent` is the indentation of
 * the line the literal starts on.
 */
function toJsLiteral(value: unknown, indent = ''): string {
  const inline = toInlineLiteral(value)
  if (inline.length <= 48 || value === null || typeof value !== 'object') return inline
  const inner = `${indent}  `
  if (Array.isArray(value)) {
    if (value.length === 0) return inline
    return `[\n${value.map((entry) => `${inner}${toJsLiteral(entry, inner)},`).join('\n')}\n${indent}]`
  }
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined)
  if (entries.length === 0) return inline
  return `{\n${entries
    .map(([key, entry]) => `${inner}${toPropertyKey(key)}: ${toJsLiteral(entry, inner)},`)
    .join('\n')}\n${indent}}`
}

function toPerspectiveLiteral(perspective: ClientPerspective): string {
  if (Array.isArray(perspective)) {
    return `[${perspective.map((entry) => toSingleQuoted(entry)).join(', ')}]`
  }
  return toSingleQuoted(perspective)
}

/** Word-wraps text into comment lines no wider than the snippet */
function toCommentLines(paragraphs: string[], indent = '', marker = '//'): string[] {
  const prefix = `${indent}${marker} `
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push(`${indent}${marker}`)
      continue
    }
    let line = ''
    for (const word of paragraph.trim().split(/\s+/)) {
      if (line && prefix.length + line.length + 1 + word.length > LINE_WIDTH) {
        lines.push(prefix + line)
        line = word
      } else {
        line = line ? `${line} ${word}` : word
      }
    }
    lines.push(prefix + line)
  }
  return lines
}

/**
 * The comment lines a query starts with (often the prompt an AI query was generated from), and
 * the query after them. The snippets put the comment above the query constant, where it reads
 * as a comment and wraps, instead of keeping it in the query string.
 */
export function splitLeadingComments(query: string): {comments: string[]; body: string} {
  const lines = query.split('\n')
  const comments: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (line.startsWith('//')) {
      comments.push(line.replace(/^\/\/\s?/, ''))
    } else if (line !== '') {
      break
    }
    index++
  }
  const body = lines.slice(index).join('\n')
  if (!body.trim()) return {comments: [], body: query}
  return {comments, body}
}

/** `manyFieldsTest` and `sanity.imageAsset` become `MANY_FIELDS_TEST` and `SANITY_IMAGE_ASSET` */
function toConstantWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase())
}

function toConstantName(words: string[]): string {
  if (words.length === 0 || /^\d/.test(words[0])) return 'QUERY'
  return `${words.join('_')}_QUERY`
}

/**
 * A name for the query constant, from whole words of the type the query filters on:
 * `AUTHOR_QUERY` for `*[_type == "author"]`, `POST_PAGE_QUERY` for two types,
 * `DOCUMENTS_QUERY` for more, `DOCUMENT_QUERY` for a document id, else up to two words of the
 * query (`COUNT_QUERY`), and `QUERY` when nothing better can be derived
 */
export function toQueryConstantName(query: string): string {
  const {body} = splitLeadingComments(query.trim())

  const typeMatch = body.match(TYPE_FILTER)
  if (typeMatch) return toConstantName(toConstantWords(typeMatch[2]))

  const typeInMatch = body.match(TYPE_IN_FILTER)
  if (typeInMatch) {
    const types = typeInMatch[1]
      .split(',')
      .map((type) => type.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
    const words = types.flatMap(toConstantWords)
    if (types.length === 1 || (types.length === 2 && words.length <= 4)) {
      return toConstantName(words)
    }
    if (types.length > 1) return 'DOCUMENTS_QUERY'
  }

  if (ID_FILTER.test(body)) return 'DOCUMENT_QUERY'

  const firstLine = body
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  const words = (firstLine?.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []).slice(0, 2)
  return toConstantName(words.flatMap(toConstantWords))
}

/** The perspective the API answers with when none is given: it changed with `2025-02-19` */
function apiDefaultPerspective(apiVersion: string): ClientPerspective {
  return isApiVersionBelow(apiVersion, PUBLISHED_DEFAULT_API_VERSION) ? 'raw' : 'published'
}

function isSamePerspective(a: ClientPerspective, b: ClientPerspective): boolean {
  const left = Array.isArray(a) ? a : [a]
  const right = Array.isArray(b) ? b : [b]
  return left.length === right.length && left.every((entry, index) => entry === right[index])
}

/** The perspective the query reads, the API default when none is set, as the dialog names it */
export function effectivePerspectiveLabel(
  input: Pick<ExportSnippetInput, 'perspective' | 'apiVersion'>,
): string {
  const perspective = input.perspective ?? apiDefaultPerspective(input.apiVersion.replace(/^v/, ''))
  return Array.isArray(perspective) ? perspective.join(', ') : perspective
}

/** Only published documents can be read without a token; every other perspective needs one */
function isPublishedPerspective(perspective: ClientPerspective): boolean {
  return isSamePerspective(perspective, 'published')
}

/** An object property, or a comment line among them */
type ObjectEntry = {key: string; value: string} | {comment: string}

function isComment(entry: ObjectEntry): entry is {comment: string} {
  return 'comment' in entry
}

/** A property that keeps its library default, left in as a comment to show it can be changed */
function defaultEntry(key: string, value: string): ObjectEntry {
  return {comment: `${key}: ${value},`}
}

function toProperty(entry: {key: string; value: string}): string {
  return entry.key === entry.value ? entry.key : `${entry.key}: ${entry.value}`
}

function toObject(entries: ObjectEntry[], indent: string, multiline = false): string {
  const inline = `{${entries.map((entry) => (isComment(entry) ? '' : toProperty(entry))).join(', ')}}`
  const canInline =
    !multiline &&
    entries.every((entry) => !isComment(entry) && !entry.value.includes('\n')) &&
    inline.length <= 48
  if (canInline) return inline
  const inner = `${indent}  `
  const lines = entries.map((entry) =>
    isComment(entry) ? `${inner}// ${entry.comment}` : `${inner}${toProperty(entry)},`,
  )
  return `{\n${lines.join('\n')}\n${indent}}`
}

type CallArgument = string | ObjectEntry[]

/**
 * A call laid out the way Prettier lays it out: on one line when it fits, with the last
 * argument broken over lines when it is an object and the others fit before it, or one
 * argument per line
 */
function toCall(start: string, args: CallArgument[], indent: string): string {
  const inlineArgs = args.map((arg) => (typeof arg === 'string' ? arg : toObject(arg, indent)))
  const oneLine = `${start}${inlineArgs.join(', ')})`
  if (!oneLine.includes('\n') && indent.length + oneLine.length <= LINE_WIDTH) return oneLine

  const last = args.at(-1)
  const leading = inlineArgs.slice(0, -1)
  const hugged = `${start}${[...leading, '{'].join(', ')}`
  if (
    Array.isArray(last) &&
    leading.every((arg) => !arg.includes('\n')) &&
    indent.length + hugged.length <= LINE_WIDTH
  ) {
    return `${start}${[...leading, toObject(last, indent, true)].join(', ')})`
  }

  const inner = `${indent}  `
  const lines = args.map(
    (arg) => `${inner}${typeof arg === 'string' ? arg : toObject(arg, inner)},`,
  )
  return `${start}\n${lines.join('\n')}\n${indent})`
}

interface SnippetContext {
  input: ExportSnippetInput
  apiVersion: string
  constantName: string
  /** The query without the comment it started with */
  queryBody: string
  /** The comment the query started with, as comment lines */
  queryComment: string[]
  /** The params as an argument, `undefined` when there are none */
  paramsArg: string | undefined
  /** `const params = …`, for params too long to pass inline */
  paramsDeclaration: string[]
  /** The perspective the query was run with, the API default resolved */
  perspective: ClientPerspective
  /** The perspective equals the API default for the API version */
  perspectiveIsApiDefault: boolean
  usesToken: boolean
}

function createContext(input: ExportSnippetInput): SnippetContext {
  const apiVersion = input.apiVersion.replace(/^v/, '')
  const {comments, body} = splitLeadingComments(input.query)
  const apiDefault = apiDefaultPerspective(apiVersion)
  const perspective = input.perspective ?? apiDefault

  let paramsArg: string | undefined
  let paramsDeclaration: string[] = []
  if (Object.keys(input.params).length > 0) {
    const literal = toJsLiteral(input.params)
    if (literal.includes('\n')) {
      paramsArg = 'params'
      paramsDeclaration = [`const params = ${literal}`]
    } else {
      paramsArg = literal
    }
  }

  return {
    input,
    apiVersion,
    constantName: toQueryConstantName(input.query),
    queryBody: body,
    queryComment: toCommentLines(comments),
    paramsArg,
    paramsDeclaration,
    perspective,
    perspectiveIsApiDefault: isSamePerspective(perspective, apiDefault),
    usesToken: !isPublishedPerspective(perspective),
  }
}

/** The query constant, its comment above it, and the params when they get a constant too */
function queryDeclaration(context: SnippetContext, wrap?: string): string[] {
  const literal = toTemplateLiteral(context.queryBody)
  return [
    ...context.queryComment,
    `const ${context.constantName} = ${wrap ? `${wrap}(${literal})` : literal}`,
    ...(context.paramsDeclaration.length > 0 ? ['', ...context.paramsDeclaration] : []),
  ]
}

/** The `createClient` options every snippet shares: where the dataset is, and how to reach it */
function clientConfigEntries(context: SnippetContext): ObjectEntry[] {
  const {input} = context
  return [
    {key: 'projectId', value: toSingleQuoted(input.projectId)},
    {key: 'dataset', value: toSingleQuoted(input.dataset)},
    {key: 'apiVersion', value: toSingleQuoted(context.apiVersion)},
    // `@sanity/client` warns when `useCdn` is left unset, so it is always spelled out
    {key: 'useCdn', value: input.useCdn ? 'true' : 'false'},
  ]
}

function perspectiveEntry(context: SnippetContext, isDefault: boolean): ObjectEntry {
  const value = toPerspectiveLiteral(context.perspective)
  return isDefault ? defaultEntry('perspective', value) : {key: 'perspective', value}
}

/** Fetch options asking for the source map along with the result */
const SOURCE_MAP_ENTRIES: ObjectEntry[] = [
  {key: 'filterResponse', value: 'false'},
  {key: 'resultSourceMap', value: 'true'},
]

/** The variable a fetch's answer goes in: the result alone, or the result and its source map */
function resultBinding(context: SnippetContext, name: string): string {
  return context.input.includeSourceMap ? `{result: ${name}, resultSourceMap}` : name
}

function resultName(context: SnippetContext): string {
  const words = context.constantName
    .replace(/_QUERY$/, '')
    .toLowerCase()
    .split('_')
  if (context.constantName === 'QUERY' || words.length === 0) return 'result'
  return words
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('')
}

/**
 * curl, with the query and params readable on lines of their own (`-G --data-urlencode` has
 * curl encode them into the URL), or, from the client's size limit on, posted as JSON as the
 * client posts them. The Authorization header is only there when the perspective needs a token.
 */
function curlSnippet(context: SnippetContext): ExportSnippet {
  const {input} = context
  const authorization = `-H "Authorization: Bearer $${TOKEN_ENV}"`
  const method = queryRequestMethod(input.query, input.params)
  const url = new URL(input.url)
  const {query, options} = splitQuerySearchParams(url.searchParams)

  let lines: string[]
  if (method === 'GET') {
    url.search = ''
    const fields = [...query, ...options].map(
      ([key, value]) => `--data-urlencode ${toShellQuoted(`${key}=${value}`)}`,
    )
    lines = [`curl -G ${toShellQuoted(url.href)}`, ...fields]
    if (context.usesToken) lines.push(authorization)
  } else {
    url.search = options.toString()
    const body = JSON.stringify({query: input.query, params: input.params}, null, 2)
    lines = [
      `curl ${toShellQuoted(url.href)}`,
      ...(context.usesToken ? [authorization] : []),
      `-H 'Content-Type: application/json'`,
      `--data-raw ${toShellQuoted(body)}`,
    ]
  }

  const code = lines
    .map(
      (line, index) => `${index === 0 ? '' : '  '}${line}${index < lines.length - 1 ? ' \\' : ''}`,
    )
    .join('\n')
  return {
    id: 'curl',
    title: EXPORT_SNIPPET_TITLES.curl,
    files: [{language: 'bash', code}],
    usesToken: context.usesToken,
    method,
  }
}

/** The comment above a token read from the environment */
const TOKEN_COMMENT = 'A read token, from the environment: keep it out of code and the browser'

/** `@sanity/client`, configured with everything the query needs, and one fetch */
function clientSnippet(context: SnippetContext): ExportSnippet {
  const {input} = context
  const config: ObjectEntry[] = [
    ...clientConfigEntries(context),
    perspectiveEntry(context, context.perspectiveIsApiDefault),
  ]
  if (input.variant) config.push({key: 'variant', value: toSingleQuoted(input.variant)})
  if (context.usesToken) {
    config.push({comment: TOKEN_COMMENT}, {key: 'token', value: `process.env.${TOKEN_ENV}`})
  }

  const args: CallArgument[] = [context.constantName]
  if (context.paramsArg || input.includeSourceMap) args.push(context.paramsArg ?? '{}')
  if (input.includeSourceMap) args.push(SOURCE_MAP_ENTRIES)

  const code = [
    `import {createClient} from '@sanity/client'`,
    '',
    `const client = createClient(${toObject(config, '', true)})`,
    '',
    ...queryDeclaration(context),
    '',
    toCall(`const ${resultBinding(context, resultName(context))} = await client.fetch(`, args, ''),
  ].join('\n')

  return {
    id: 'client',
    title: EXPORT_SNIPPET_TITLES.client,
    files: [{language: 'typescript', code}],
    usesToken: context.usesToken,
  }
}

/**
 * next-sanity's Live Content API setup (`defineLive`) and a page that queries with
 * `sanityFetch`, which runs on the server, so the token is only ever a server token
 */
function nextSanitySnippet(context: SnippetContext): ExportSnippet {
  const {input} = context
  const liveArgs: ObjectEntry[] = [{key: 'client', value: 'client'}]
  if (context.usesToken) {
    liveArgs.push(
      {comment: 'Server-only: a NEXT_PUBLIC_ prefix would ship the token to the browser'},
      {key: 'serverToken', value: `process.env.${TOKEN_ENV}`},
    )
  }

  const liveClientConfig = clientConfigEntries(context)
  // sanityFetch returns a source map only when the client asks for one
  if (input.includeSourceMap) liveClientConfig.push({key: 'resultSourceMap', value: 'true'})

  const live = [
    `import {createClient} from 'next-sanity'`,
    `import {defineLive} from 'next-sanity/live'`,
    '',
    `const client = createClient(${toObject(liveClientConfig, '', true)})`,
    '',
    '// Render <SanityLive /> in the root layout to keep fetched content up to date',
    `export const {sanityFetch, SanityLive} = defineLive(${toObject(liveArgs, '', liveArgs.length > 1)})`,
  ].join('\n')

  // Sanity Live takes every perspective but the legacy `raw`, and reads published content
  // unless asked otherwise (or in draft mode)
  const isRaw = isSamePerspective(context.perspective, 'raw')
  const fetchArgs: ObjectEntry[] = [{key: 'query', value: context.constantName}]
  if (Object.keys(input.params).length > 0) {
    fetchArgs.push({key: 'params', value: toJsLiteral(input.params, '    ')})
  }
  if (isRaw) {
    fetchArgs.push(
      {comment: "sanityFetch has no 'raw' perspective, the one this query ran with"},
      {comment: "perspective: 'drafts',"},
    )
  } else {
    fetchArgs.push(perspectiveEntry(context, isPublishedPerspective(context.perspective)))
  }
  if (input.variant) fetchArgs.push({key: 'variant', value: toSingleQuoted(input.variant)})

  const binding = input.includeSourceMap ? '{data, sourceMap}' : '{data}'
  const page = [
    `import {defineQuery} from 'next-sanity'`,
    '',
    `import {sanityFetch} from '@/sanity/live'`,
    '',
    ...context.queryComment,
    `const ${context.constantName} = defineQuery(${toTemplateLiteral(context.queryBody)})`,
    '',
    'export default async function Page() {',
    `  const ${binding} = await sanityFetch(${toObject(fetchArgs, '  ', true)})`,
    '',
    '  return <pre>{JSON.stringify(data, null, 2)}</pre>',
    '}',
  ].join('\n')

  return {
    id: 'next-sanity',
    title: EXPORT_SNIPPET_TITLES['next-sanity'],
    files: [
      {path: 'src/sanity/live.ts', language: 'typescript', code: live},
      {path: 'src/app/page.tsx', language: 'jsx', code: page},
    ],
    usesToken: context.usesToken,
  }
}

/**
 * Per-request options for the snippets whose client is shared with the browser (Astro) or the
 * whole app (SvelteKit, Nuxt): the perspective and the token go with the one fetch that needs
 * them, so other queries keep reading published content without a token
 */
function perRequestEntries(context: SnippetContext, tokenComment: string, token: string) {
  const entries: ObjectEntry[] = []
  if (context.usesToken) {
    entries.push(
      {key: 'perspective', value: toPerspectiveLiteral(context.perspective)},
      {comment: tokenComment},
      {key: 'token', value: token},
    )
  }
  if (context.input.includeSourceMap) entries.push(...SOURCE_MAP_ENTRIES)
  return entries
}

function fetchArguments(context: SnippetContext, options: ObjectEntry[]): CallArgument[] {
  const args: CallArgument[] = [context.constantName]
  if (context.paramsArg || options.length > 0) args.push(context.paramsArg ?? '{}')
  if (options.length > 0) args.push(options)
  return args
}

/** Client options the integrations take in their config: the perspective when it is shared */
function sharedPerspectiveEntries(context: SnippetContext): ObjectEntry[] {
  if (context.usesToken) return []
  return [perspectiveEntry(context, context.perspectiveIsApiDefault)]
}

function variantEntries(context: SnippetContext): ObjectEntry[] {
  return context.input.variant
    ? [{key: 'variant', value: toSingleQuoted(context.input.variant)}]
    : []
}

/**
 * The `@sanity/astro` integration and a page that queries with its `sanity:client` client in
 * the frontmatter, which runs on the server. That client is also bundled for the browser, so
 * the token stays out of the integration's config.
 */
function astroSnippet(context: SnippetContext): ExportSnippet {
  const config: ObjectEntry[] = [
    ...clientConfigEntries(context),
    ...sharedPerspectiveEntries(context),
    ...variantEntries(context),
  ]
  const astroConfig = [
    `import sanity from '@sanity/astro'`,
    `import {defineConfig} from 'astro/config'`,
    '',
    'export default defineConfig({',
    '  integrations: [',
    `    sanity(${toObject(config, '    ', true)}),`,
    '  ],',
    '})',
  ].join('\n')

  const options = perRequestEntries(
    context,
    'Server-only: Astro keeps variables without a PUBLIC_ prefix out of the browser',
    `import.meta.env.${TOKEN_ENV}`,
  )
  const name = resultName(context)
  const page = [
    '---',
    `import {sanityClient} from 'sanity:client'`,
    '',
    ...queryDeclaration(context),
    '',
    toCall(
      `const ${resultBinding(context, name)} = await sanityClient.fetch(`,
      fetchArguments(context, options),
      '',
    ),
    '---',
    '',
    `<pre>{JSON.stringify(${name}, null, 2)}</pre>`,
  ].join('\n')

  return {
    id: 'astro',
    title: EXPORT_SNIPPET_TITLES.astro,
    files: [
      {path: 'astro.config.mjs', language: 'javascript', code: astroConfig},
      {path: 'src/pages/index.astro', language: 'jsx', code: page},
    ],
    usesToken: context.usesToken,
  }
}

/**
 * A client from `@sanity/sveltekit` and a server `load` function that queries with it. The token
 * comes from `$env/static/private`, which SvelteKit refuses to import into browser code.
 */
function svelteKitSnippet(context: SnippetContext): ExportSnippet {
  const config: ObjectEntry[] = [
    ...clientConfigEntries(context),
    ...sharedPerspectiveEntries(context),
    ...variantEntries(context),
  ]
  const client = [
    `import {createClient} from '@sanity/sveltekit'`,
    '',
    `export const client = createClient(${toObject(config, '', true)})`,
  ].join('\n')

  const options = perRequestEntries(
    context,
    'Server-only: SvelteKit will not import $env/static/private into browser code',
    TOKEN_ENV,
  )
  const name = resultName(context)
  const page = [
    `import {defineQuery} from '@sanity/sveltekit'`,
    ...(context.usesToken ? [`import {${TOKEN_ENV}} from '$env/static/private'`] : []),
    `import {client} from '$lib/sanity'`,
    '',
    `import type {PageServerLoad} from './$types'`,
    '',
    ...queryDeclaration(context, 'defineQuery'),
    '',
    'export const load: PageServerLoad = async () => {',
    `  ${toCall(`const ${resultBinding(context, name)} = await client.fetch(`, fetchArguments(context, options), '  ')}`,
    `  return {${name}}`,
    '}',
  ].join('\n')

  return {
    id: 'sveltekit',
    title: EXPORT_SNIPPET_TITLES.sveltekit,
    files: [
      {path: 'src/lib/sanity.ts', language: 'typescript', code: client},
      {path: 'src/routes/+page.server.ts', language: 'typescript', code: page},
    ],
    usesToken: context.usesToken,
  }
}

/**
 * The `@nuxtjs/sanity` module. Published content is queried from a page with `useSanityQuery`,
 * which also runs in the browser; any other perspective needs a token, which only a server
 * route may hold, so the query goes in one (`useSanity(event)` there reads the private
 * runtime config) for pages to fetch.
 */
function nuxtSnippet(context: SnippetContext): ExportSnippet {
  const {input} = context
  // The module's defaults differ from the client's: `useCdn: true` and `perspective: 'raw'`
  const config: ObjectEntry[] = [
    {key: 'projectId', value: toSingleQuoted(input.projectId)},
    {key: 'dataset', value: toSingleQuoted(input.dataset)},
    {key: 'apiVersion', value: toSingleQuoted(context.apiVersion)},
    input.useCdn ? defaultEntry('useCdn', 'true') : {key: 'useCdn', value: 'false'},
  ]
  if (!context.usesToken) {
    config.push(perspectiveEntry(context, isSamePerspective(context.perspective, 'raw')))
  }

  const nuxtConfig = [
    'export default defineNuxtConfig({',
    `  modules: ['@nuxtjs/sanity'],`,
    `  sanity: ${toObject(config, '  ', true)},`,
    ...(context.usesToken
      ? [
          '  runtimeConfig: {',
          '    sanity: {',
          '      // Private runtime config stays on the server; NUXT_SANITY_TOKEN overrides it at',
          '      // runtime',
          `      token: process.env.${TOKEN_ENV},`,
          '    },',
          '  },',
        ]
      : []),
    '})',
  ].join('\n')

  const options: ObjectEntry[] = []
  if (context.usesToken) {
    options.push({key: 'perspective', value: toPerspectiveLiteral(context.perspective)})
  }
  if (input.variant) options.push({key: 'variant', value: toSingleQuoted(input.variant)})
  if (input.includeSourceMap) options.push(...SOURCE_MAP_ENTRIES)

  if (context.usesToken) {
    const route =
      context.constantName === 'QUERY'
        ? 'query'
        : resultName(context).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    const handler = [
      ...queryDeclaration(context, 'defineQuery'),
      '',
      `// Fetch it from a page: const {data} = await useFetch('/api/${route}')`,
      'export default defineEventHandler((event) => {',
      `  ${toCall('return useSanity(event).fetch(', fetchArguments(context, options), '  ')}`,
      '})',
    ].join('\n')
    return {
      id: 'nuxt',
      title: EXPORT_SNIPPET_TITLES.nuxt,
      files: [
        {path: 'nuxt.config.ts', language: 'typescript', code: nuxtConfig},
        {path: `server/api/${route}.get.ts`, language: 'typescript', code: handler},
      ],
      usesToken: true,
    }
  }

  const queryOptions: CallArgument[] = [context.constantName]
  if (context.paramsArg || options.length > 0) queryOptions.push(context.paramsArg ?? '{}')
  if (options.length > 0) queryOptions.push([{key: 'queryOptions', value: toObject(options, '  ')}])
  const binding = input.includeSourceMap ? '{data, sourceMap}' : '{data}'
  const page = [
    '<script setup lang="ts">',
    ...queryDeclaration(context, 'defineQuery'),
    '',
    toCall(`const ${binding} = await useSanityQuery(`, queryOptions, ''),
    '</script>',
    '',
    '<template>',
    '  <pre>{{ data }}</pre>',
    '</template>',
  ].join('\n')

  return {
    id: 'nuxt',
    title: EXPORT_SNIPPET_TITLES.nuxt,
    files: [
      {path: 'nuxt.config.ts', language: 'typescript', code: nuxtConfig},
      {path: 'pages/index.vue', language: 'jsx', code: page},
    ],
    usesToken: false,
  }
}

const SNIPPET_BUILDERS: Record<ExportSnippetId, (context: SnippetContext) => ExportSnippet> = {
  'client': clientSnippet,
  'curl': curlSnippet,
  'next-sanity': nextSanitySnippet,
  'astro': astroSnippet,
  'sveltekit': svelteKitSnippet,
  'nuxt': nuxtSnippet,
}

/**
 * The snippets for a query, in `ids` order (every snippet when unset). Each is meant to be
 * pasted as is: imports, the client set up with the options the query needs (a library default
 * is left in as a comment, so it can be changed), the query as a constant, and the fetch.
 */
export function buildExportSnippets(
  input: ExportSnippetInput,
  ids: readonly ExportSnippetId[] = Object.keys(SNIPPET_BUILDERS) as ExportSnippetId[],
): ExportSnippet[] {
  const context = createContext(input)
  return ids.map((id) => SNIPPET_BUILDERS[id](context))
}

/** The file's path as a comment in its own syntax, to label it when files are copied together */
function filePathComment(file: ExportSnippetFile): string {
  if (!file.path) return ''
  if (/\.(vue|astro)$/.test(file.path)) return `<!-- ${file.path} -->`
  return `// ${file.path}`
}

/** A snippet's files as one text, each labelled with its path */
export function exportSnippetText(snippet: ExportSnippet): string {
  if (snippet.files.length === 1) return snippet.files[0].code
  return snippet.files.map((file) => `${filePathComment(file)}\n${file.code}`).join('\n\n')
}
