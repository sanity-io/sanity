// A studio evaluates its config, and every module the config imports, before it can render the
// login screen. Of the private internals entry, only its `/1` subpath may be part of that graph:
// the bare entry and the other subpaths are large, and a studio that imports them up front
// downloads all of it before the user has even signed in. The form components are the largest
// part of the package and render only once a document is open, so neither they nor the facades
// that load them on first render (`core/form/lazy.tsx`) belong in that graph either. This builds studio configs from this repo the way `sanity build` does
// (resolving `sanity` to its built `lib`) and walks the static import graph from the studio's
// entry, the same graph a browser loads before the login screen.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

import {build} from 'vite'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const sanityPackage = path.dirname(require.resolve('sanity/package.json'))
const sanityLib = path.join(sanityPackage, 'lib')

const INTERNALS = '_dangerously_use_private_internals_that_do_not_follow_semver'
const FIRST_LOAD_SUBPATH = '1'
const ENTRY = '\0first-load-entry'

/** Studio configs whose first-load graph is checked, relative to the repo root. */
const STUDIO_CONFIGS = ['perf/bench/sanity.config.ts', 'perf/studio/sanity.config.ts']

const FORM_DIR = 'src/core/form'
const FORM_FACADES = `${FORM_DIR}/lazy.tsx`
const FORM_IMPLEMENTATIONS = `${FORM_DIR}/publicComponents.lazy.ts`
const FIRST_LOAD_EXPORTS = `src/_exports/${INTERNALS}/${FIRST_LOAD_SUBPATH}.ts`
const FACADES = `the form component facades (${FORM_FACADES})`

/** @param {string} file - relative to the `sanity` package */
function readSanitySource(file) {
  return fs.readFileSync(path.join(sanityPackage, file), 'utf8')
}

/**
 * The form components that `core/form/lazy.tsx` code-splits, keyed by the path of their
 * implementation module without its extension (`src/core/form/studio/FormBuilder`).
 */
const formComponentModules = new Map(
  [...readSanitySource(FORM_IMPLEMENTATIONS).matchAll(/export \{(\w+)\} from '\.\/([^']+)'/g)].map(
    ([, name, specifier]) => [path.posix.join(FORM_DIR, specifier), name],
  ),
)

/**
 * The internals entry a built module belongs to, or `undefined` when it is not one. Only the
 * entry files themselves count: the chunks they import are shared with the public entries.
 *
 * @param {string} id - a resolved module id
 */
function internalsEntryOf(id) {
  const relative = path.relative(sanityLib, id.split('?')[0]).split(path.sep).join('/')
  if (relative === `${INTERNALS}.js`) return `sanity/${INTERNALS}`
  const match = new RegExp(`^${INTERNALS}/([^/]+)\\.js$`).exec(relative)
  return match ? `sanity/${INTERNALS}/${match[1]}` : undefined
}

/**
 * The form components whose implementation or facade a built `sanity` chunk contains, read from
 * its sourcemap. The chunk that re-exports them all for the facades has no sourcemap of its own.
 *
 * @param {string} id - a resolved module id
 */
function formComponentsIn(id) {
  const file = id.split('?')[0]
  if (path.dirname(file) !== sanityLib) return []
  if (path.basename(file).startsWith('publicComponents.lazy-'))
    return [...formComponentModules.values()]
  if (!fs.existsSync(`${file}.map`)) return []
  /** @type {{sources: string[]}} */
  const map = JSON.parse(fs.readFileSync(`${file}.map`, 'utf8'))
  return map.sources.flatMap((source) => {
    const module = path.posix.relative('..', source)
    if (module === FORM_FACADES) return [FACADES]
    const name = formComponentModules.get(module.replace(/\.tsx?$/, ''))
    return name ? [name] : []
  })
}

/** @param {string} id */
function displayId(id) {
  if (id === ENTRY) return '<studio entry>'
  const file = id.split('?')[0]
  const nodeModules = file.lastIndexOf('/node_modules/')
  if (nodeModules !== -1) return file.slice(nodeModules + '/node_modules/'.length)
  return path.relative(repoRoot, file)
}

/**
 * Builds the studio entry for `configPath` and returns what of the private internals and the form
 * components its static import graph holds, each with the chain of imports that reaches it.
 *
 * @param {string} configPath - absolute path to a `sanity.config.ts`
 */
async function firstLoadGraph(configPath) {
  /** @type {{entry: string, chain: string[]}[]} */
  const internals = []
  /** @type {{components: string[], chain: string[]}[]} */
  const formComponents = []
  await build({
    configFile: false,
    logLevel: 'silent',
    root: path.dirname(configPath),
    oxc: {jsx: {runtime: 'automatic'}},
    build: {write: false, minify: false, rolldownOptions: {input: ENTRY}},
    plugins: [
      {
        name: 'first-load-graph',
        resolveId: (id) => (id === ENTRY ? ENTRY : null),
        // Mirrors the `.sanity/runtime/app.js` entry that `sanity build` generates
        load: (id) =>
          id === ENTRY
            ? [
                `import studioConfig from ${JSON.stringify(configPath)}`,
                `import {renderStudio} from 'sanity'`,
                `renderStudio(document.getElementById('sanity'), studioConfig)`,
              ].join('\n')
            : null,
        buildEnd() {
          /** @type {Map<string, string | null>} */
          const parents = new Map([[ENTRY, null]])
          /** @param {string} id */
          const chainTo = (id) => {
            const chain = []
            for (let at = /** @type {string | null} */ (id); at; at = parents.get(at) ?? null) {
              chain.unshift(displayId(at))
            }
            return chain
          }
          const queue = [ENTRY]
          while (queue.length > 0) {
            const id = /** @type {string} */ (queue.shift())
            const entry = internalsEntryOf(id)
            if (entry && entry !== `sanity/${INTERNALS}/${FIRST_LOAD_SUBPATH}`) {
              internals.push({entry, chain: chainTo(id)})
            }
            const components = formComponentsIn(id)
            if (components.length > 0) formComponents.push({components, chain: chainTo(id)})
            for (const imported of this.getModuleInfo(id)?.importedIds ?? []) {
              if (parents.has(imported)) continue
              parents.set(imported, id)
              queue.push(imported)
            }
          }
        },
      },
    ],
  })
  return {internals, formComponents}
}

void test('reads the form components', () => {
  assert.ok(
    formComponentModules.size > 0,
    `the first-load test reads packages/sanity/${FORM_IMPLEMENTATIONS} with a regular expression; update it to the file's current shape`,
  )
})

for (const config of STUDIO_CONFIGS) {
  void test(`the first-load graph of ${config}`, async (t) => {
    const {internals, formComponents} = await firstLoadGraph(path.join(repoRoot, config))

    await t.test(
      `only imports private internals from sanity/${INTERNALS}/${FIRST_LOAD_SUBPATH}`,
      () => {
        assert.deepEqual(
          internals.map(({entry, chain}) => `${entry}, imported through ${chain.join(' → ')}`),
          [],
          [
            `${config} loads private internals before the login screen.`,
            `Code that is evaluated before sign-in (the studio config and every module it imports statically) may only import private internals from \`sanity/${INTERNALS}/${FIRST_LOAD_SUBPATH}\`.`,
            `Either import the name from \`sanity/${INTERNALS}/${FIRST_LOAD_SUBPATH}\` (moving it to packages/sanity/${FIRST_LOAD_EXPORTS} if a studio needs it up front), or load the code that uses it with a dynamic \`import()\` so it is fetched after sign-in.`,
          ].join('\n'),
        )
      },
    )

    await t.test('loads no form component before the login screen', () => {
      assert.deepEqual(
        formComponents.map(
          ({components, chain}) =>
            `${components.join(', ')}, imported through ${chain.join(' → ')}`,
        ),
        [],
        [
          `${config} loads form components before the login screen.`,
          `The components in packages/sanity/${FORM_IMPLEMENTATIONS}, and their facades in packages/sanity/${FORM_FACADES}, only render once a document is open, so code that is evaluated before sign-in must not import them, nor export them from packages/sanity/${FIRST_LOAD_EXPORTS}.`,
          `Load the code that renders them with a dynamic \`import()\` (a \`lazy()\` component, for one) from \`sanity/${INTERNALS}\`, so it is fetched after sign-in; the last module of the chain is where it comes in.`,
        ].join('\n'),
      )
    })
  })
}
