import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, defineConfig} from 'vite'

export default defineConfig(({command}) => ({
  plugins: [viteReact({compiler: {target: '19'}}), vanillaExtractPlugin()],
  // Dev resolves the sanity package to workspace sources (same trick as the
  // dev studios' cli configs), so `pnpm dev:studio-diagnostics` works without
  // a prior `pnpm build` and reflects source edits live. Builds use the
  // published lib condition. The vanilla-extract plugin is needed because the
  // source graph includes .css.ts modules, and `sanity` must be excluded from
  // optimizeDeps — pre-bundling the linked sources duplicates context
  // providers around lazy import()s (same caveat as the studio cli configs).
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
