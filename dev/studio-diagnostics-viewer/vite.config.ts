import {studioPandaCss, unlayeredPandaCss} from '@repo/pandacss/vite'
import viteReact from '@vitejs/plugin-react'
import {defaultClientConditions, defineConfig} from 'vite'

export default defineConfig(({command}) => ({
  plugins: [
    viteReact({compiler: {target: '19'}}),
    // The build only has to strip the layer declaration of the stylesheet main.tsx imports
    ...(command === 'serve' ? studioPandaCss({packages: ['sanity']}) : [unlayeredPandaCss()]),
  ],
  // Dev resolves the sanity package to workspace sources (same trick as the
  // dev studios' cli configs), so `pnpm dev:studio-diagnostics` works without
  // a prior `pnpm build` and reflects source edits live. Builds use the
  // published lib condition. The Panda CSS plugins are needed because the
  // source graph includes .css.ts modules (src/main.tsx imports the stylesheet
  // they fill), and `sanity` must be excluded from optimizeDeps — pre-bundling
  // the linked sources duplicates context providers around lazy import()s
  // (same caveat as the studio cli configs).
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
