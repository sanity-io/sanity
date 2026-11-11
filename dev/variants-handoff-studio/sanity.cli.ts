import {viteCssModules} from '@repo/css-modules-kit'
import {studioPandaCss} from '@repo/pandacss/vite'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig} from 'vite'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'variants-2-0'

// Same monorepo setup as dev/test-studio/sanity.cli.ts: resolve workspace sources via the
// `monorepo` condition so edits under packages/sanity/src hot-reload.
export default defineCliConfig({
  api: {projectId, dataset},
  deployment: {appId: 'tf6sfb2f5tuw6jtt3qysvelr'},
  reactStrictMode: true,
  unstable_bundledDev: false,
  reactCompiler: {
    transform: 'oxc',
    target: '19',
    sources: ['dev/variants-handoff-studio', '/sanity/src/'],
  },
  async vite(viteConfig, {command, mode}) {
    const nextConfig = mergeConfig(viteConfig, {
      // `sanity dev` resolves `sanity` to its sources, so its Panda CSS `.css.ts` modules are built here (as dev/test-studio does).
      plugins: command === 'serve' ? studioPandaCss() : [],
      optimizeDeps: {exclude: ['sanity']},
    })
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
        css: viteCssModules,
      })
    }
    return nextConfig
  },
})
