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
  // `rollup: {vanillaExtract: true}` option in `@sanity/pkg-utils` did
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
})
