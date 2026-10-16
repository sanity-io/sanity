import {studioPandaCss, visionVanillaExtractPlugin} from '@repo/pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

// Two `.css.ts` compilers meet in this suite. Vision's own `.css.ts` modules are vanilla-extract
// and still need its transform in jsdom for file scoping (they throw "Styles were unable to be
// assigned to a file" without it); style *injection* is skipped via `disableRuntimeStyles` below,
// since no jsdom test asserts on styles or vanilla-extract class names. The `sanity` sources the
// tests resolve to (the `monorepo` condition) are Panda CSS, so their `.css.ts` modules get the
// `@pandacss/vite` instance `studioPandaCss()` registers for the package, and the vanilla-extract
// plugin is limited to this package's directory — unscoped, it would compile them as
// vanilla-extract and fail on the missing `@vanilla-extract/css` import.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: [
      '@vanilla-extract/css/disableRuntimeStyles',
      // Fail tests during which react-dom reports a prop leaking onto a DOM element
      '@repo/test-config/vitest/failOnReactDomPropWarnings',
    ],
  },
  plugins: [
    ...visionVanillaExtractPlugin(),
    ...studioPandaCss(),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
