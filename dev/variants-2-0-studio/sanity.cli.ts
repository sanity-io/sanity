import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig} from 'vite'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ppsg7ml5'
const dataset = process.env.SANITY_STUDIO_DATASET || 'northfold'

// Same monorepo setup as dev/test-studio/sanity.cli.ts: resolve workspace sources via the
// `monorepo` condition so edits under packages/sanity/src hot-reload.
export default defineCliConfig({
  api: {projectId, dataset},
  reactStrictMode: true,
  unstable_bundledDev: false,
  reactCompiler: {
    transform: 'oxc',
    target: '19',
    sources: ['dev/variants-2-0-studio', '/sanity/src/'],
  },
  async vite(viteConfig, {command, mode}) {
    const nextConfig = mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin()],
      optimizeDeps: {exclude: ['sanity']},
    })
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
      })
    }
    return nextConfig
  },
})
