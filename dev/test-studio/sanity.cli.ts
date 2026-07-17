import path from 'node:path'

import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import {defineCliConfig} from 'sanity/cli'
import {defaultClientConditions, mergeConfig, type UserConfig} from 'vite'

const isStaging = process.env.SANITY_INTERNAL_ENV == 'staging'
// Enables Vite DevTools (https://devtools.vite.dev) for both `sanity dev` and `sanity build`.
// During `sanity build` it records a Rolldown build session, which can then be inspected from
// the DevTools dock in a running `sanity dev` server without restarting it.
// Usage: `pnpm devtools:test-studio` from the repo root (see AGENTS.md).
const isViteDevToolsEnabled = process.env.ENABLE_VITE_DEVTOOLS === 'true'
const reactCompilerAllowList = /\/(?:sanity|@sanity\/vision)\/src\/.*\.tsx?$/

export default defineCliConfig({
  api: isStaging
    ? {
        projectId: 'exx11uqh',
        dataset: 'playground',
      }
    : {
        projectId: 'ppsg7ml5',
        dataset: 'test',
      },
  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false pnpm dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  reactCompiler: {
    target: '19',
    // By default the compiler is loaded up on all workspace files, even sanity/lib/structure.js which is pre-compiled with `tsdown`,
    // and so we filter by just studio files
    sources: (filename) => {
      // The default behavior is to always skip node_modules: https://github.com/facebook/react/blob/d6cae440e34c6250928e18bed4a16480f83ae18a/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L326
      if (filename.indexOf('node_modules') !== -1) {
        return false
      }
      // Compile files in the test studio itself
      if (filename.indexOf('dev/test-studio') !== -1) {
        return true
      }
      // If the file is `.ts` or `.tsx` then we should run the compiler (it's resolved with the `monorepo` condition during `sanity dev`)
      // otherwise it's likely resolving a built file that had react compiler already applied during its build process
      return reactCompilerAllowList.test(filename)
    },
  },
  async vite(viteConfig: UserConfig, {command, mode}): Promise<UserConfig> {
    const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

    let nextConfig = mergeConfig(viteConfig, {
      plugins: [vanillaExtractPlugin()],
      server: {
        warmup: {
          clientFiles: [
            /**
             * Since the test studio on the monorepo is using src files for `sanity`, `sanity/structure`, `@sanity/vision`, etc,
             * it's not enough with the default `./.sanity/runtime/app.js` warmup file,
             * we have to add a few more to avoid the initial "waterfall of reload doom" scenario.
             * The ones we add here are from lazy loaded import() calls that are discovered late due to our file structure.
             * They're not a problem in production, as our npm bundling hoists the dynamic imports to the top level entrypoint so vite discovers them early.
             */
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/structure/structureTool.ts#L108
            './node_modules/sanity/src/structure/components/structureTool/StructureToolBoundary.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/presentation/plugin.tsx#L26
            './node_modules/sanity/src/presentation/PresentationToolGrantsCheck.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/presentation/plugin.tsx#L27
            './node_modules/sanity/src/presentation/loader/BroadcastDisplayedDocument.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/structure/panes/StructureToolPane.tsx#L26
            './node_modules/sanity/src/structure/panes/userComponent/UserComponentPane.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/structure/panes/StructureToolPane.tsx#L27
            './node_modules/sanity/src/structure/panes/document/DocumentPane.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/structure/panes/StructureToolPane.tsx#L28
            './node_modules/sanity/src/structure/panes/documentList/PaneContainer.tsx',
            // https://github.com/sanity-io/sanity/blob/f6357dbe1e19076286c06de8d2c272058c0dc01e/packages/sanity/src/structure/panes/StructureToolPane.tsx#L29
            './node_modules/sanity/src/structure/panes/list/ListPane.tsx',
          ],
        },
      },
      // Needed due to the monorepo setup, optimizeDeps will cause duplication of context providers when it chunks lazy imports so we have to disable optimization
      optimizeDeps: {exclude: ['sanity']},
      build: {
        rolldownOptions: {
          input: {
            // NOTE: this is required to build static files for the presentation preview iframe
            preview: path.resolve(__dirname, 'preview/index.html'),
          },
        },
      },
    } satisfies UserConfig)

    if (isViteDevToolsEnabled) {
      // Lazy import so the devtools package is only loaded when the flag is enabled
      const {DevTools} = await import('@vitejs/devtools')
      nextConfig = mergeConfig(nextConfig, {
        plugins: [DevTools()],
        // `devtools: {}` makes `sanity build` emit a Rolldown build session that the DevTools dock can inspect
        build: {rolldownOptions: {devtools: {}}},
      } satisfies UserConfig)
    }

    // Support React Production Profiling on deployed studios
    if (reactProductionProfiling && command === 'build') {
      return mergeConfig(nextConfig, {
        // Aliasing to react-dom/profiling is necessary in the production build, otherwise React can't run the profiler on the deployed studio
        resolve: {alias: {'react-dom/client': require.resolve('react-dom/profiling')}},
        // Not minifying identifiers ensures that the React DevTools components inspector has readable component names
        esbuild: {minifyIdentifiers: false},
        // Enable production source maps to easier debug deployed test studios
        build: {sourcemap: true},
      } satisfies UserConfig)
    }

    // Support hot reloading of files from monorepo workspaces during development
    if (mode !== 'production' && command === 'serve') {
      return mergeConfig(nextConfig, {
        resolve: {conditions: ['monorepo', ...defaultClientConditions]},
      } satisfies UserConfig)
    }

    return nextConfig
  },
})
