import {viteCssModules} from '@repo/css-modules-kit'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  // The CSS modules compile with Lightning CSS and the pattern of the package build, so the class
  // names the tests render are the ones `lib/bundle.css` ships (`test.css` below opts them in)
  css: viteCssModules,
  test: {
    environment: 'jsdom',
    css: {include: [/\.module\.css$/]},
  },
  plugins: [
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
