import {pandacss} from '@pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  plugins: [
    // Rewrites the `css()` calls of the Panda CSS `.css.ts` modules to the class names the
    // package build ships, see packages/sanity/vitest.config.mts
    pandacss({cwd: import.meta.dirname, transform: true}),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
