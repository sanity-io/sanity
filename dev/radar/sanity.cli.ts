import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'mhfozd0z',
    dataset: 'bench',
  },
  // Opt into Vite's experimental full-bundle mode so late-discovered lazy
  // import() targets no longer need server.warmup.clientFiles workarounds.
  // {@link https://vite.dev/guide/rolldown#full-bundle-mode}
  unstable_bundledDev: true,
  reactCompiler: {
    // React Compiler on `oxc-transform-react` (no babel), see dev/test-studio/sanity.cli.ts
    transform: 'oxc',
    target: '19',
    // By default the compiler runs on all workspace files, even sanity/lib/structure.js which is
    // pre-compiled with `tsdown`, and so we filter by just studio files (substring filters; the
    // `monorepo` condition resolves workspace sources under `src/` during `sanity dev`)
    sources: ['dev/radar', '/sanity/src/'],
  },
  vite(viteConfig: UserConfig, {command, mode}): UserConfig {
    const nextConfig = mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin()],
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
    } satisfies UserConfig)

    // Support hot reloading of files from monorepo workspaces during development
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
      } satisfies UserConfig)
    }

    return nextConfig
  },
})
