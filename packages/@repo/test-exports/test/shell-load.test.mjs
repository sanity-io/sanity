// After sign-in a studio renders its shell first: the navbar, the tool menu and, on a path that
// matches no tool (`/404`), the "Tool not found" screen. The private internals that only lazily
// loaded code needs (the document stack: forms and inputs, field diffs, comments, document panes)
// are on `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, and that subpath
// must never be part of what a studio loads to render `/404`.
//
// This builds studio configs the way `sanity build` does (resolving `sanity` to its built `lib`) and
// walks what the shell loads, starting from the studio's entry: every static import, and the
// dynamic imports of the `sanity` package itself, whose lazy layout, navbar, plugin providers and
// preloads load with the shell. A dynamic import in studio or plugin code is the lazy boundary of a
// tool, an input or a document component, which is where `…-2` belongs, so the walk stops there.
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import path from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

import {build} from 'vite'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../../..')
const sanityLib = path.join(path.dirname(require.resolve('sanity/package.json')), 'lib')

const INTERNALS = '_dangerously_use_private_internals_that_do_not_follow_semver'
const LAZY_ONLY = `${INTERNALS}-2`
const LAZY_ONLY_ENTRY = path.join(sanityLib, `${LAZY_ONLY}.js`)
const ENTRY = '\0shell-load-entry'

/** Studio configs whose shell must not load `…-2`, relative to the repo root. */
const STUDIO_CONFIGS = ['perf/bench/sanity.config.ts', 'perf/studio/sanity.config.ts']

/** A studio that imports `…-2` once from its navbar (the shell) and once from a lazy tool. */
const FIXTURE_CONFIG = path.join(here, 'fixtures/shell-load/shellLoadFixture.config.tsx')

/** @param {string} id */
function displayId(id) {
  if (id === ENTRY) return '<studio entry>'
  const file = id.split('?')[0]
  const nodeModules = file.lastIndexOf('/node_modules/')
  if (nodeModules !== -1) return file.slice(nodeModules + '/node_modules/'.length)
  if (file.startsWith(sanityLib)) return `sanity/lib/${path.relative(sanityLib, file)}`
  return path.relative(repoRoot, file)
}

/** @param {string} id */
function isSanityModule(id) {
  return id.split('?')[0].startsWith(sanityLib)
}

/**
 * Builds the studio entry for `configPath` and returns every chain of imports through which the
 * shell's graph reaches `…-2`.
 *
 * @param {string} configPath - absolute path to a studio config
 */
async function shellLoadsLazyOnlyInternals(configPath) {
  /** @type {string[][]} */
  const chains = []
  await build({
    configFile: false,
    logLevel: 'silent',
    root: path.dirname(configPath),
    oxc: {jsx: {runtime: 'automatic'}},
    build: {write: false, minify: false, rolldownOptions: {input: ENTRY}},
    plugins: [
      {
        name: 'shell-load-graph',
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
            if (id.split('?')[0] === LAZY_ONLY_ENTRY) {
              chains.push(chainTo(id))
              continue
            }
            const info = this.getModuleInfo(id)
            const next = [
              ...(info?.importedIds ?? []),
              ...(isSanityModule(id) ? (info?.dynamicallyImportedIds ?? []) : []),
            ]
            for (const imported of next) {
              if (parents.has(imported)) continue
              parents.set(imported, id)
              queue.push(imported)
            }
          }
        },
      },
    ],
  })
  return chains
}

/** @param {string} config */
function failureMessage(config) {
  return [
    `${config} loads sanity/${LAZY_ONLY} with the studio shell, before any tool renders.`,
    `That subpath holds the internals only lazily loaded code needs (forms and inputs, field diffs, comments, document panes), and the shell that renders /404 (the navbar, the tool menu, the "Tool not found" screen) must not load it.`,
    `The chain ends in the module that imports it statically. Load that code behind a lazy boundary instead (a \`lazy()\` tool, input or document component, or a dynamic \`import()\` that destructures the names it uses), or import the name from \`sanity/${INTERNALS}\` if the shell needs it.`,
  ].join('\n')
}

for (const config of STUDIO_CONFIGS) {
  void test(`the shell of ${config} does not load sanity/${LAZY_ONLY}`, async () => {
    const chains = await shellLoadsLazyOnlyInternals(path.join(repoRoot, config))
    assert.deepEqual(
      chains.map((chain) => chain.join(' → ')),
      [],
      failureMessage(config),
    )
  })
}

void test(`reports a static import of sanity/${LAZY_ONLY} from the shell, not one behind a lazy boundary`, async () => {
  const chains = await shellLoadsLazyOnlyInternals(FIXTURE_CONFIG)
  assert.deepEqual(
    chains.map((chain) => chain.slice(-2)),
    [
      [
        'packages/@repo/test-exports/test/fixtures/shell-load/NavbarWithLazyOnlyInternals.tsx',
        `sanity/lib/${LAZY_ONLY}.js`,
      ],
    ],
  )
})
