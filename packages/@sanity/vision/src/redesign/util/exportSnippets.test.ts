import {execFileSync} from 'node:child_process'

import {type ClientPerspective} from '@sanity/client'
import {transformWithOxc} from 'vite'
import {describe, expect, it} from 'vitest'

import {encodeQueryString} from '../../util/encodeQueryString'
import {QUERY_URL_SIZE_LIMIT, queryRequestMethod} from '../../util/queryRequestMethod'
import {EXPORT_SNIPPET_IDS} from '../store/visionStorage'
import {
  buildExportSnippets,
  effectivePerspectiveLabel,
  type ExportSnippet,
  type ExportSnippetFile,
  type ExportSnippetInput,
  exportSnippetText,
  splitLeadingComments,
  toQueryConstantName,
} from './exportSnippets'
import {parseQueryPaste} from './parseQueryPaste'

const PROJECT_ID = 'abc123'
const DATASET = 'production'

/** The input the dialog hands over for a query, with the URL Vision would request */
function createInput(
  overrides: Partial<Omit<ExportSnippetInput, 'url'>> & {
    query?: string
    params?: Record<string, unknown>
  } = {},
): ExportSnippetInput {
  const query = overrides.query ?? '*[_type == "author" && _id == $id]{name}'
  const params = overrides.params ?? {id: 'abc'}
  const apiVersion = overrides.apiVersion ?? 'v2025-02-19'
  const useCdn = overrides.useCdn ?? true
  const options = new URLSearchParams()
  const {perspective, variant, resultSourceMap} = overrides
  if (perspective)
    options.set('perspective', Array.isArray(perspective) ? perspective.join(',') : perspective)
  if (variant) options.set('variant', variant)
  if (resultSourceMap) options.set('resultSourceMap', String(resultSourceMap))
  const host = useCdn && (!perspective || perspective === 'published') ? 'apicdn' : 'api'
  const search = encodeQueryString(query, params)
  const extra = options.toString()
  return {
    query,
    params,
    url: `https://${PROJECT_ID}.${host}.sanity.io/${apiVersion}/data/query/${DATASET}${search}${extra ? `&${extra}` : ''}`,
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion,
    perspective,
    variant,
    resultSourceMap,
    useCdn,
  }
}

function snippet(input: ExportSnippetInput, id: ExportSnippet['id']): ExportSnippet {
  return buildExportSnippets(input, [id])[0]
}

function file(input: ExportSnippetInput, id: ExportSnippet['id'], index = 0): string {
  return snippet(input, id).files[index].code
}

/** The script of a single-file component: Astro's frontmatter, Vue's `<script setup>` */
function scriptOf(code: string, path: string): {code: string; filename: string} {
  if (path.endsWith('.astro')) {
    const [, frontmatter, template] = code.split(/^---$/m)
    // The template's expressions are JSX
    return {code: `${frontmatter}\nconst template = <>${template}</>`, filename: 'page.tsx'}
  }
  if (path.endsWith('.vue')) {
    const script = /<script setup lang="ts">\n([\s\S]*?)<\/script>/.exec(code)
    if (!script) throw new Error(`No <script setup> in ${path}`)
    return {code: script[1], filename: 'page.ts'}
  }
  return {code, filename: path.endsWith('.tsx') ? 'page.tsx' : 'file.ts'}
}

/** Throws with the parser's message when a file is not valid TypeScript (or shell) */
async function assertParses(snippetFile: ExportSnippetFile) {
  if (snippetFile.language === 'bash') {
    execFileSync('bash', ['-n'], {input: snippetFile.code})
    return
  }
  const {code, filename} = scriptOf(snippetFile.code, snippetFile.path ?? 'file.ts')
  await transformWithOxc(code, filename, {})
}

const PERSPECTIVES: {name: string; perspective?: ClientPerspective; apiVersion?: string}[] = [
  {name: 'the API default on a version that reads published', apiVersion: 'v2025-02-19'},
  {name: 'the API default on a version that reads raw', apiVersion: 'v2021-10-21'},
  {name: 'published', perspective: 'published'},
  {name: 'drafts', perspective: 'drafts'},
  {name: 'raw', perspective: 'raw'},
  {name: 'previewDrafts', perspective: 'previewDrafts', apiVersion: 'v2023-08-01'},
  {name: 'a release stack', perspective: ['rSummer', 'drafts']},
]

const PARAMS: {name: string; params: Record<string, unknown>; query: string}[] = [
  {name: 'no params', params: {}, query: '*[_type == "post"]{_id, title}'},
  {
    name: 'params',
    params: {slug: 'hello-world', tags: ["it's", 'news'], limit: 10, filter: {draft: false}},
    query:
      '// The newest posts with this slug\n*[_type == "post" && slug.current == $slug && count((tags[])[@ in $tags]) > 0][0...$limit]',
  },
]

describe('buildExportSnippets', () => {
  describe.each(PERSPECTIVES)('with $name', ({perspective, apiVersion}) => {
    describe.each(PARAMS)('and $name', ({params, query}) => {
      const input = createInput({perspective, apiVersion, params, query})
      const snippets = buildExportSnippets(input)
      const needsToken = effectivePerspectiveLabel(input) !== 'published'

      it.each(snippets.map((built) => [built.title, built] as const))(
        '%s parses and reads a token only when the perspective needs one',
        async (_title, built) => {
          for (const snippetFile of built.files) await assertParses(snippetFile)
          const text = exportSnippetText(built)
          expect(built.usesToken).toBe(needsToken)
          expect(text.includes('SANITY_API_TOKEN')).toBe(needsToken)
          // Nothing but the variable ever stands for a token
          expect(text).not.toMatch(/\bsk[A-Za-z0-9]{20,}/)
          // Params are passed only when the query has them: curl sends them as `$name` arguments
          const passesParams = built.id === 'curl' ? /\$slug|%24slug/ : /\bparams\b/
          expect(passesParams.test(text)).toBe(Object.keys(params).length > 0)
          // A comment never ends up inside the query string
          expect(text).not.toMatch(/`\/\//)
        },
      )

      it('exports a curl command that pastes back into Vision as the same query', () => {
        const parsed = parseQueryPaste(file(input, 'curl'), [DATASET])
        expect(parsed).toMatchObject({
          source: 'curl',
          query,
          params,
          dataset: DATASET,
          apiVersion: input.apiVersion,
        })
        // Vision only switches to the perspectives it has a setting for, but the URL keeps them all
        expect(parsed?.urlPerspective).toEqual(
          Array.isArray(perspective) ? perspective.join(',') : perspective,
        )
      })
    })
  })

  it('builds the snippets in the order asked for', () => {
    const ids = ['nuxt', 'curl'] as const
    expect(buildExportSnippets(createInput(), ids).map((built) => built.id)).toEqual(ids)
    expect(buildExportSnippets(createInput()).map((built) => built.id)).toEqual(EXPORT_SNIPPET_IDS)
  })

  it('writes a published @sanity/client snippet without a token, the API default commented out', () => {
    expect(file(createInput({params: {}, query: '*[_type == "author"]'}), 'client'))
      .toMatchInlineSnapshot(`
        "import {createClient} from '@sanity/client'

        const client = createClient({
          projectId: 'abc123',
          dataset: 'production',
          apiVersion: '2025-02-19',
          useCdn: true,
          // perspective: 'published',
        })

        const AUTHOR_QUERY = \`*[_type == "author"]\`

        const author = await client.fetch(AUTHOR_QUERY)"
      `)
  })

  it('reads drafts with a token from the environment in @sanity/client', () => {
    expect(
      file(
        createInput({
          perspective: 'drafts',
          query:
            '// Fetch the author by id, with only the field the card shows\n*[_type == "author" && _id == $id]{name}',
        }),
        'client',
      ),
    ).toMatchInlineSnapshot(`
      "import {createClient} from '@sanity/client'

      const client = createClient({
        projectId: 'abc123',
        dataset: 'production',
        apiVersion: '2025-02-19',
        useCdn: true,
        perspective: 'drafts',
        // A read token, from the environment: keep it out of code and the browser
        token: process.env.SANITY_API_TOKEN,
      })

      // Fetch the author by id, with only the field the card shows
      const AUTHOR_QUERY = \`*[_type == "author" && _id == $id]{name}\`

      const author = await client.fetch(AUTHOR_QUERY, {id: 'abc'})"
    `)
  })

  it('sends the query in the URL with curl, adding the Authorization header for drafts', () => {
    expect(file(createInput(), 'curl')).toMatchInlineSnapshot(`
      "curl -G 'https://abc123.apicdn.sanity.io/v2025-02-19/data/query/production' \\
        --data-urlencode 'query=*[_type == "author" && _id == $id]{name}' \\
        --data-urlencode '$id="abc"'"
    `)
    expect(file(createInput({perspective: 'drafts', useCdn: false}), 'curl'))
      .toMatchInlineSnapshot(`
      "curl -G 'https://abc123.api.sanity.io/v2025-02-19/data/query/production' \\
        --data-urlencode 'query=*[_type == "author" && _id == $id]{name}' \\
        --data-urlencode '$id="abc"' \\
        --data-urlencode 'perspective=drafts' \\
        -H "Authorization: Bearer $SANITY_API_TOKEN""
    `)
  })

  it('posts the query and params as a JSON body once they are too long for a URL, as the client does', () => {
    const query = `*[_type == 'author' && _id == $id]{name} // ${'x'.repeat(QUERY_URL_SIZE_LIMIT)}`
    const params = {id: "it's"}
    expect(queryRequestMethod(query, params)).toBe('POST')
    const input = createInput({query, params, perspective: 'drafts', resultSourceMap: true})

    const curl = snippet(input, 'curl')
    expect(curl.method).toBe('POST')
    const code = curl.files[0].code
    expect(code.split('\n').slice(0, 4)).toEqual([
      `curl 'https://abc123.api.sanity.io/v2025-02-19/data/query/production?perspective=drafts&resultSourceMap=true' \\`,
      '  -H "Authorization: Bearer $SANITY_API_TOKEN" \\',
      `  -H 'Content-Type: application/json' \\`,
      `  --data-raw '{`,
    ])
    expect(parseQueryPaste(code, [DATASET])).toMatchObject({
      query,
      params,
      perspective: 'drafts',
      includeSourceMap: true,
    })
    expect(snippet(createInput(), 'curl').method).toBe('GET')
  })

  it('writes next-sanity with Sanity Live, the server token only for perspectives that need it', () => {
    const published = snippet(createInput(), 'next-sanity')
    expect(published.files.map((nextFile) => nextFile.path)).toEqual([
      'src/sanity/live.ts',
      'src/app/page.tsx',
    ])
    expect(published.files[0].code).toMatchInlineSnapshot(`
      "import {createClient} from 'next-sanity'
      import {defineLive} from 'next-sanity/live'

      const client = createClient({
        projectId: 'abc123',
        dataset: 'production',
        apiVersion: '2025-02-19',
        useCdn: true,
      })

      // Render <SanityLive /> in the root layout to keep fetched content up to date
      export const {sanityFetch, SanityLive} = defineLive({client})"
    `)
    expect(published.files[1].code).toMatchInlineSnapshot(`
      "import {defineQuery} from 'next-sanity'

      import {sanityFetch} from '@/sanity/live'

      const AUTHOR_QUERY = defineQuery(\`*[_type == "author" && _id == $id]{name}\`)

      export default async function Page() {
        const {data} = await sanityFetch({
          query: AUTHOR_QUERY,
          params: {id: 'abc'},
          // perspective: 'published',
        })

        return <pre>{JSON.stringify(data, null, 2)}</pre>
      }"
    `)

    const drafts = snippet(createInput({perspective: 'drafts'}), 'next-sanity')
    expect(drafts.files[0].code).toContain('  serverToken: process.env.SANITY_API_TOKEN,')
    expect(drafts.files[1].code).toContain(`    perspective: 'drafts',`)
  })

  it('leaves the raw perspective sanityFetch has no option for out of next-sanity, and says so', () => {
    const page = file(createInput({perspective: 'raw'}), 'next-sanity', 1)
    expect(page).toContain(
      "    // sanityFetch has no 'raw' perspective, the one this query ran with",
    )
    expect(page).not.toMatch(/^\s+perspective:/m)
  })

  it('configures @sanity/astro, passing the token per request for drafts', () => {
    const drafts = snippet(createInput({perspective: 'drafts'}), 'astro')
    expect(drafts.files.map((astroFile) => astroFile.path)).toEqual([
      'astro.config.mjs',
      'src/pages/index.astro',
    ])
    expect(drafts.files[0].code).toMatchInlineSnapshot(`
      "import sanity from '@sanity/astro'
      import {defineConfig} from 'astro/config'

      export default defineConfig({
        integrations: [
          sanity({
            projectId: 'abc123',
            dataset: 'production',
            apiVersion: '2025-02-19',
            useCdn: true,
          }),
        ],
      })"
    `)
    expect(drafts.files[1].code).toMatchInlineSnapshot(`
      "---
      import {sanityClient} from 'sanity:client'

      const AUTHOR_QUERY = \`*[_type == "author" && _id == $id]{name}\`

      const author = await sanityClient.fetch(AUTHOR_QUERY, {id: 'abc'}, {
        perspective: 'drafts',
        // Server-only: Astro keeps variables without a PUBLIC_ prefix out of the browser
        token: import.meta.env.SANITY_API_TOKEN,
      })
      ---

      <pre>{JSON.stringify(author, null, 2)}</pre>"
    `)
  })

  it('reads the token from $env/static/private in a SvelteKit server load', () => {
    const drafts = snippet(createInput({perspective: 'drafts'}), 'sveltekit')
    expect(drafts.files.map((svelteFile) => svelteFile.path)).toEqual([
      'src/lib/sanity.ts',
      'src/routes/+page.server.ts',
    ])
    expect(drafts.files[1].code).toMatchInlineSnapshot(`
      "import {defineQuery} from '@sanity/sveltekit'
      import {SANITY_API_TOKEN} from '$env/static/private'
      import {client} from '$lib/sanity'

      import type {PageServerLoad} from './$types'

      const AUTHOR_QUERY = defineQuery(\`*[_type == "author" && _id == $id]{name}\`)

      export const load: PageServerLoad = async () => {
        const author = await client.fetch(AUTHOR_QUERY, {id: 'abc'}, {
          perspective: 'drafts',
          // Server-only: SvelteKit will not import $env/static/private into browser code
          token: SANITY_API_TOKEN,
        })
        return {author}
      }"
    `)
  })

  it('queries from a Nuxt page when published, and from a server route with a private token otherwise', () => {
    const published = snippet(createInput(), 'nuxt')
    expect(published.files.map((nuxtFile) => nuxtFile.path)).toEqual([
      'nuxt.config.ts',
      'pages/index.vue',
    ])
    expect(published.files[0].code).toMatchInlineSnapshot(`
      "export default defineNuxtConfig({
        modules: ['@nuxtjs/sanity'],
        sanity: {
          projectId: 'abc123',
          dataset: 'production',
          apiVersion: '2025-02-19',
          // useCdn: true,
          perspective: 'published',
        },
      })"
    `)
    expect(published.files[1].code).toMatchInlineSnapshot(`
      "<script setup lang="ts">
      const AUTHOR_QUERY = defineQuery(\`*[_type == "author" && _id == $id]{name}\`)

      const {data} = await useSanityQuery(AUTHOR_QUERY, {id: 'abc'})
      </script>

      <template>
        <pre>{{ data }}</pre>
      </template>"
    `)

    const drafts = snippet(createInput({perspective: 'drafts'}), 'nuxt')
    expect(drafts.files.map((nuxtFile) => nuxtFile.path)).toEqual([
      'nuxt.config.ts',
      'server/api/author.get.ts',
    ])
    expect(drafts.files[0].code).toMatchInlineSnapshot(`
      "export default defineNuxtConfig({
        modules: ['@nuxtjs/sanity'],
        sanity: {
          projectId: 'abc123',
          dataset: 'production',
          apiVersion: '2025-02-19',
          // useCdn: true,
        },
        runtimeConfig: {
          sanity: {
            // Private runtime config stays on the server; NUXT_SANITY_TOKEN overrides it at
            // runtime
            token: process.env.SANITY_API_TOKEN,
          },
        },
      })"
    `)
    expect(drafts.files[1].code).toMatchInlineSnapshot(`
      "const AUTHOR_QUERY = defineQuery(\`*[_type == "author" && _id == $id]{name}\`)

      // Fetch it from a page: const {data} = await useFetch('/api/author')
      export default defineEventHandler((event) => {
        return useSanity(event).fetch(AUTHOR_QUERY, {id: 'abc'}, {
          perspective: 'drafts',
        })
      })"
    `)
    // The module option would put the token in the public runtime config
    expect(drafts.files[0].code).not.toMatch(/\n  sanity: \{[^}]*token/)
  })

  it('handles variants, source maps and queries that need escaping in a template literal', () => {
    const input = createInput({
      query: 'count(*[`tick` in tags && title match "${x}"])',
      params: {},
      perspective: ['rSummer', 'drafts'],
      variant: 'de-DE',
      apiVersion: 'vX',
      resultSourceMap: true,
      useCdn: false,
    })
    expect(file(input, 'client')).toMatchInlineSnapshot(`
      "import {createClient} from '@sanity/client'

      const client = createClient({
        projectId: 'abc123',
        dataset: 'production',
        apiVersion: 'X',
        useCdn: false,
        perspective: ['rSummer', 'drafts'],
        variant: 'de-DE',
        // A read token, from the environment: keep it out of code and the browser
        token: process.env.SANITY_API_TOKEN,
      })

      const COUNT_TICK_QUERY = \`count(*[\\\`tick\\\` in tags && title match "\\\${x}"])\`

      const {result: countTick, resultSourceMap} = await client.fetch(
        COUNT_TICK_QUERY,
        {},
        {filterResponse: false, resultSourceMap: true},
      )"
    `)
    expect(file(input, 'next-sanity', 0)).toContain('  resultSourceMap: true,')
    expect(file(input, 'next-sanity', 1)).toContain('const {data, sourceMap} = await sanityFetch(')
  })

  it('asks for the keyed source map when that format is picked, and for none when it is off', () => {
    const keyed = createInput({perspective: 'drafts', resultSourceMap: 'withKeyArraySelector'})
    expect(file(keyed, 'client')).toContain("resultSourceMap: 'withKeyArraySelector'")
    expect(file(keyed, 'next-sanity', 0)).toContain("  resultSourceMap: 'withKeyArraySelector',")
    expect(file(keyed, 'curl')).toContain('resultSourceMap=withKeyArraySelector')
    for (const id of ['astro', 'sveltekit', 'nuxt'] as const) {
      expect(exportSnippetText(snippet(keyed, id))).toContain(
        "resultSourceMap: 'withKeyArraySelector'",
      )
    }

    for (const built of buildExportSnippets(createInput({perspective: 'drafts'}))) {
      const text = exportSnippetText(built)
      expect(text).not.toContain('resultSourceMap')
      expect(text).not.toContain('sourceMap')
    }
  })

  it('writes a params key that would set the prototype as a computed property', () => {
    const params = JSON.parse('{"id": "a", "__proto__": {"polluted": true}}') as Record<
      string,
      unknown
    >
    const code = file(createInput({params}), 'client')
    expect(code).toContain(`['__proto__']: {polluted: true}`)
  })

  it('exports deeply nested params without overflowing the call stack', () => {
    let deep: Record<string, unknown> = {x: 1}
    for (let index = 0; index < 5000; index++) {
      deep = {nested: deep}
    }
    expect(() => buildExportSnippets(createInput({params: {deep}}))).not.toThrow()
    expect(file(createInput({params: {deep}}), 'client')).toContain('null')
  })

  it('joins the files of a snippet under comments with their paths for the Copy all button', () => {
    expect(exportSnippetText(snippet(createInput(), 'nuxt'))).toMatch(
      /^\/\/ nuxt\.config\.ts\n[\s\S]+\n\n<!-- pages\/index\.vue -->\n<script setup/,
    )
    expect(exportSnippetText(snippet(createInput(), 'client'))).toBe(file(createInput(), 'client'))
  })
})

describe('splitLeadingComments', () => {
  it('moves the comment lines a query starts with out of it', () => {
    expect(splitLeadingComments('// one\n  // two\n*[_type == "a"]')).toEqual({
      comments: ['one', 'two'],
      body: '*[_type == "a"]',
    })
    expect(splitLeadingComments('*[_type == "a"] // trailing')).toEqual({
      comments: [],
      body: '*[_type == "a"] // trailing',
    })
  })
})

describe('toQueryConstantName', () => {
  it('names the query after what it fetches, in a few whole words', () => {
    expect(toQueryConstantName('*[_type == "author"]')).toBe('AUTHOR_QUERY')
    expect(toQueryConstantName('*[_type == "blogPost"]')).toBe('BLOG_POST_QUERY')
    expect(toQueryConstantName('*[_type in ["post", "page"]]')).toBe('POST_PAGE_QUERY')
    expect(toQueryConstantName('*[_type in ["manyFieldsTest", "allTypes", "allNamedTypes"]]')).toBe(
      'DOCUMENTS_QUERY',
    )
    expect(toQueryConstantName('*[_id == "abc"][0]')).toBe('DOCUMENT_QUERY')
    expect(toQueryConstantName('count(*)')).toBe('COUNT_QUERY')
    expect(toQueryConstantName('// A comment first\n*[_type == "author"]')).toBe('AUTHOR_QUERY')
    expect(toQueryConstantName('')).toBe('QUERY')
    expect(toQueryConstantName('123')).toBe('QUERY')
  })
})
