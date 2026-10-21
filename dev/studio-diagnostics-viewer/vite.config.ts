import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, defineConfig, normalizePath, type Plugin} from 'vite'

/** The `sanity` package: the repository's only Panda CSS project (packages/sanity/panda.config.ts). */
const SANITY_PACKAGE_DIR = fileURLToPath(new URL('../../packages/sanity/', import.meta.url))
/** The app entry, as a Vite module id (forward slashes on every platform). */
const ENTRY_ID = normalizePath(fileURLToPath(new URL('./src/main.tsx', import.meta.url)))
/** The stylesheet `@pandacss/vite` fills, see `sanityPandaCss()`. */
const PANDA_CSS = fileURLToPath(new URL('./src/panda.css', import.meta.url))

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Builds the `sanity` package's Panda CSS from source for `vite dev`, which resolves the package to
 * its sources (the `monorepo` condition below); the build resolves the built package and the
 * `bundle.css` it imports, so none of this runs there. The `@pandacss/vite` instance points at the
 * package's Panda project: it rewrites the `css()` calls of its `.css.ts` modules to class names
 * and generates their CSS into `src/panda.css`, which the last plugin imports from the app entry —
 * the counterpart of the built package's `sanity/bundle.css` import. `removeCascadeLayers()` takes
 * Panda's cascade layers out of that CSS again, as `cascadeLayers: false` does for `bundle.css`
 * (packages/sanity/tsdown.config.ts). Same setup as the dev studios' `sanity.cli.ts`.
 */
function sanityPandaCss() {
  const pandaCssImport: Plugin = {
    name: 'studio-diagnostics-viewer:panda-css-import',
    transform: {
      filter: {id: new RegExp(`^${escapeRegExp(ENTRY_ID)}(?:\\?|$)`)},
      handler: (code) => ({code: `import ${JSON.stringify(PANDA_CSS)}\n${code}`, map: null}),
    },
  }
  return [
    pandacss({cwd: SANITY_PACKAGE_DIR, transform: true}),
    removeCascadeLayers(['reset', 'base', 'tokens', 'recipes', 'utilities']),
    pandaCssImport,
  ]
}

export default defineConfig(({command}) => ({
  plugins: [
    viteReact({compiler: {target: '19'}}),
    ...(command === 'serve' ? sanityPandaCss() : []),
  ],
  // Dev resolves the sanity package to workspace sources (same trick as the
  // dev studios' cli configs), so `pnpm dev:studio-diagnostics` works without
  // a prior `pnpm build` and reflects source edits live. Builds use the
  // published lib condition. The Panda CSS plugins are needed because the
  // source graph includes .css.ts modules, and `sanity` must be excluded from
  // optimizeDeps — pre-bundling the linked sources duplicates context providers
  // around lazy import()s (same caveat as the studio cli configs).
  resolve: command === 'serve' ? {conditions: ['monorepo', ...defaultClientConditions]} : undefined,
  optimizeDeps: command === 'serve' ? {exclude: ['sanity']} : undefined,
  preview: {
    port: 3343,
    strictPort: true,
  },
  server: {
    port: 3343,
    strictPort: true,
  },
}))
