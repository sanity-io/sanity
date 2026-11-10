import {fileURLToPath} from 'node:url'

import {sanityPandaCss} from '@repo/pandacss/vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, defineConfig, normalizePath} from 'vite'

/** The app entry, as a Vite module id (forward slashes on every platform). */
const ENTRY_ID = normalizePath(fileURLToPath(new URL('./src/main.tsx', import.meta.url)))

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineConfig(({command}) => ({
  plugins: [
    viteReact({compiler: {target: '19'}}),
    // Builds the `sanity` package's Panda CSS from source for `vite dev` and imports the generated
    // stylesheet from the app entry, the counterpart of the built package's `sanity/bundle.css`
    // import; the build resolves the built package, so none of this runs there
    ...(command === 'serve'
      ? sanityPandaCss({entry: new RegExp(`^${escapeRegExp(ENTRY_ID)}(?:\\?|$)`)})
      : []),
  ],
  // Dev resolves the sanity package to workspace sources (same trick as the
  // dev studios' cli configs), so `pnpm dev:studio-diagnostics` works without
  // a prior `pnpm build` and reflects source edits live. Builds use the
  // published lib condition. The Panda CSS plugins are needed because the
  // source graph includes .css.ts modules (see packages/@repo/pandacss), and
  // `sanity` must be excluded from optimizeDeps — pre-bundling the linked
  // sources duplicates context providers around lazy import()s (same caveat
  // as the studio cli configs).
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
