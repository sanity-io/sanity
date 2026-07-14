import {readFileSync} from 'node:fs'

import {defineConfig} from '@repo/package.config'

// Same behavior as the built-in `process.env.PKG_VERSION` define in `@sanity/pkg-utils`:
// an explicit env var wins (used by test-studio preview builds to attach custom version details),
// otherwise the version from package.json is inlined. See `src/core/version.ts`.
const {version}: {version: string} = JSON.parse(
  readFileSync(new URL('package.json', import.meta.url), 'utf8'),
)

export default defineConfig(
  {
    entry: {
      'index': './src/_exports/index.ts',
      '_internal': './src/_exports/_internal.ts',
      '_singletons': './src/_exports/_singletons.ts',
      '_createContext': './src/_exports/_createContext.ts',
      'cli': './src/_exports/cli.ts',
      'desk': './src/_exports/desk.ts',
      'presentation': './src/_exports/presentation.ts',
      'router': './src/_exports/router.ts',
      'structure': './src/_exports/structure.ts',
      'media-library': './src/_exports/media-library.ts',
      'migrate': './src/_exports/migrate.ts',
    },
    reactCompiler: {target: '19'},
    styledComponents: true,
    // Extracts the CSS from vanilla-extract `.css.ts` files into `lib/bundle.css` and wires up the
    // conditional `./bundle.css` export pattern (self-referential import + node shim), like the
    // `rollup: {vanillaExtract: true}` option in `@sanity/pkg-utils` did
    vanillaExtract: true,
    define: {
      'process.env.PKG_VERSION': JSON.stringify(process.env.PKG_VERSION || version),
    },
  },
  {
    // The entry points import each other through `sanity/...` self-references (e.g.
    // `sanity/_singletons`), which must stay external so they resolve through the exports map at
    // runtime instead of being inlined into every chunk that imports them
    deps: {neverBundle: [/^sanity(\/|$)/]},
  },
)
