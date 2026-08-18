import {defineConfig} from '@repo/tsdown.config'

import pkg from './package.json' with {type: 'json'}

export default defineConfig({
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
    'workbench.js',
  ],
  reactCompiler: {target: '19'},
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
