import {defineConfig} from '@repo/test-config/vitest'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact from '@vitejs/plugin-react'

// The vanilla-extract plugin is still required in jsdom: `.css.ts` modules need its transform
// for file scoping (they throw "Styles were unable to be assigned to a file" without it). Style
// *injection* is skipped via `disableRuntimeStyles` below, since no jsdom test asserts on styles
// or vanilla-extract class names.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['@vanilla-extract/css/disableRuntimeStyles'],
  },
  plugins: [
    vanillaExtractPlugin(),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
