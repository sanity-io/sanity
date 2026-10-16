import {viteCssModules} from '@repo/css-modules-kit'
import {studioPandaCss} from '@repo/pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  // Vision's CSS modules compile with Lightning CSS and the pattern of the package build, so the
  // class names the tests render are the ones `lib/bundle.css` ships (`test.css` below opts them in)
  css: viteCssModules,
  test: {
    environment: 'jsdom',
    css: {include: [/\.module\.css$/]},
    setupFiles: [
      // Fail tests during which react-dom reports a prop leaking onto a DOM element
      '@repo/test-config/vitest/failOnReactDomPropWarnings',
    ],
  },
  plugins: [
    // The `sanity` sources the tests resolve to (the `monorepo` condition) are styled with Panda
    // CSS, so their `.css.ts` modules need the `@pandacss/vite` instance this registers for them
    ...studioPandaCss(),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
