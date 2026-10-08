import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {defineConfig} from '@repo/tsdown.config'
import {build, mergeConfig, type Rolldown} from 'tsdown'

import pkg from './package.json' with {type: 'json'}

const config = await defineConfig({
  // Filenames under `_exports/` map 1:1 to export names (index, cli, structure, …)
  entry: './src/_exports/*.ts',
  // Also wipe legacy root-level entry artifacts from older pkg-utils layouts (a string[] replaces
  // the shared `clean: ['lib']` default, so `lib` must be listed explicitly)
  clean: [
    'lib',
    '_internal.js',
    '_singletons.js',
    '_createContext.js',
    'cli.js',
    'desk.js',
    'migrate.js',
    'presentation.js',
    'router.js',
    'structure.js',
    'dashboard.js',
  ],
  // `transform: 'oxc'` runs the React Compiler through `oxc-transform-react` (the native Rust
  // port) in the same pass that strips TypeScript and lowers JSX, instead of a separate
  // `babel-plugin-react-compiler` pass
  reactCompiler: {transform: 'oxc', target: '19'},
  styledComponents: true,
  // Extracts the CSS from vanilla-extract `.css.ts` files into `lib/bundle.css` and wires up the
  // conditional `./bundle.css` export pattern (self-referential import + node shim), like the
  // `rollup: {vanillaExtract: true}` option in `@sanity/pkg-utils` did.
  // The `import 'sanity/bundle.css'` this injects into the entry barrels is also why package.json
  // declares `sideEffects: true`: with `false` or a `*.css` allowlist, bundlers bypass the
  // side-effect-free barrels and eliminate the bare CSS import together with them, before the
  // stylesheet's own side-effect status is ever consulted (see #13322 and #13332)
  vanillaExtract: true,
  define: {
    // Injects the version `SANITY_VERSION` reports (see `src/core/version.ts`). An explicit
    // env var wins so preview releases can attach their own version (see pkg-pr-new.yml),
    // otherwise the version from package.json is inlined.
    __PKG_VERSION__: JSON.stringify(process.env.PKG_VERSION || pkg.version),
  },
  // The entry points import each other through `sanity/...` self-references (e.g.
  // `sanity/_singletons`), which must stay external so they resolve through the exports map at
  // runtime instead of being inlined into every chunk that imports them
  deps: {neverBundle: [/^sanity(\/|$)/]},
  // Emits `lib/analyze-data.md` (LLM-friendly module/chunk breakdown). Opt-in because analysis
  // adds work to the tsdown build. Usage: `pnpm analyze:sanity` from the repo root (see AGENTS.md).
  bundleAnalyzer: process.env.ENABLE_BUNDLE_ANALYZER === 'true',
})

// Bundles `*.ts?worker&inline` imports (the validation worker) into Blob-backed factories, the
// way Vite does for studios that bundle the sources directly
export default mergeConfig(config, {plugins: [inlineWorker()]})

const SUFFIX = '?worker&inline'

/**
 * Reproduces Vite's `import Worker from './file.ts?worker&inline'` for the package build: the
 * worker entry is bundled on its own (self-contained, IIFE, browser platform) and the module
 * resolves to a factory that starts the worker from a Blob URL of that code. The published
 * package therefore ships the worker inside a regular chunk rather than as a separate file, which
 * is what lets a consuming studio's bundler, and the CDN-hosted auto-updating studio, start it
 * without knowing about it.
 */
function inlineWorker(): Rolldown.Plugin {
  return {
    name: 'sanity:inline-worker',
    resolveId(source, importer) {
      if (!source.endsWith(SUFFIX) || !importer) return null
      const file = path.resolve(path.dirname(importer), source.slice(0, -SUFFIX.length))
      return `${file}${SUFFIX}`
    },
    async load(id) {
      if (!id.endsWith(SUFFIX)) return null
      const code = await bundleWorker(id.slice(0, -SUFFIX.length))
      return `const source = ${JSON.stringify(code)}
const blob = typeof Blob === 'undefined' ? undefined : new Blob([source], {type: 'text/javascript;charset=utf-8'})
export default function InlineWorker(options) {
  const objectUrl = blob && URL.createObjectURL(blob)
  if (!objectUrl) throw new Error('Inline workers are not supported in this environment')
  try {
    return new Worker(objectUrl, options)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
`
    },
  }
}

async function bundleWorker(file: string): Promise<string> {
  const outDir = await mkdtemp(path.join(tmpdir(), 'sanity-inline-worker-'))
  try {
    await build({
      // A nested build with its own options: it must not pick up this config file.
      config: false,
      entry: {worker: file},
      outDir,
      format: 'iife',
      platform: 'browser',
      tsconfig: 'tsconfig.lib.json',
      // Everything the worker needs must be inside the blob: nothing can be imported from it.
      deps: {alwaysBundle: [/./]},
      define: {'__DEV__': 'false', 'process.env.NODE_ENV': '"production"'},
      // Fully minified, unlike the chunks around it: a consuming studio's build minifies its
      // dependencies' modules again but never the inside of a string literal.
      minify: true,
      dts: false,
      clean: false,
      sourcemap: false,
      hash: false,
      report: false,
      publint: false,
      logLevel: 'warn',
      outputOptions: {inlineDynamicImports: true},
    })
    const files = await readdir(outDir)
    const output = files.find((name) => /^worker(\.iife)?\.js$/.test(name))
    if (!output) {
      throw new Error(
        `Inline worker build produced no bundle for ${file} (got ${files.join(', ')})`,
      )
    }
    return readFile(path.join(outDir, output), 'utf8')
  } finally {
    await rm(outDir, {recursive: true, force: true})
  }
}
