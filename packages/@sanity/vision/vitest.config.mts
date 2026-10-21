import {viteCssModules} from '@repo/css-modules-kit'
import {sanityPandaCss} from '@repo/pandacss/vite'
import {defineConfig} from '@repo/test-config/vitest'
import viteReact from '@vitejs/plugin-react'
import {type Plugin} from 'vite'

const STYLE_INJECTION = '__vite__updateStyle(__vite__id, __vite__css)'

/**
 * Keeps the class names of a compiled CSS module and drops the stylesheet Vitest would inject into
 * the document, so this jsdom suite runs without styles like the `sanity` one: vision's stylesheet
 * hides parts of the trees the tests query (the root key of a result, for one).
 */
function cssModulesWithoutStyles(): Plugin {
  return {
    name: 'vision:css-modules-without-styles',
    enforce: 'post',
    transform: {
      filter: {id: /\.module\.css(?:\?|$)/},
      handler(code, id) {
        if (!code.includes('__vite__updateStyle')) return null
        if (!code.includes(STYLE_INJECTION)) {
          throw new Error(`Found no \`${STYLE_INJECTION}\` to drop in ${id}`)
        }
        return {code: code.replace(STYLE_INJECTION, ''), map: null}
      },
    },
  }
}

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
    cssModulesWithoutStyles(),
    // The `sanity` sources the tests resolve to (the `monorepo` condition) are Panda CSS, which
    // this rewrites to class names; without an `entry`, no stylesheet is imported into jsdom
    ...sanityPandaCss(),
    // React Compiler through `oxc-transform-react` (no babel), same as packages/sanity
    viteReact({compiler: {target: '19'}}),
  ],
})
