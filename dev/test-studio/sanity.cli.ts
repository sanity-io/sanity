import path from 'node:path'

import {defineCliConfig} from 'sanity/cli'
import {type UserConfig} from 'vite'

const millionLintEnabled = process.env.REACT_MILLION_LINT === 'true'
const millionLintEverything = process.env.REACT_MILLION_LINT_EVERYTHING === 'true'
const millionInclude: string[] = []
try {
  if (millionLintEnabled && !millionLintEverything) {
    for (const filePath of require('./.react-compiler-bailout-report.json')) {
      millionInclude.push(`**/${filePath}`)
    }
  }
} catch (err) {
  throw new Error('Failed to read lint report, did you run `pnpm report:react-compiler-bailout`?', {
    cause: err,
  })
}

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },

  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false pnpm dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  reactCompiler:
    millionLintEnabled && !millionLintEverything
      ? {
          target: '19',
          sources: (filename) => {
            /**
             * This is the default filter when `sources` is not defined.
             * Since we're overriding it we have to ensure we don't accidentally try running the compiler on non-src files from npm.
             */
            if (filename.includes('node_modules')) {
              return false
            }
            return millionInclude.every(
              (pattern) => !filename.endsWith(`/${pattern.split('**/')[1]}`),
            )
          },
        }
      : {target: '19'},
  vite(viteConfig: UserConfig): UserConfig {
    const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

    return {
      ...viteConfig,
      server: {
        ...viteConfig.server,
        warmup: {
          ...viteConfig.server?.warmup,
          clientFiles: [
            ...(viteConfig.server?.warmup?.clientFiles || []),
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
      plugins: millionLintEnabled
        ? [
            /**
             * We're doing a dynamic import here, instead of a static import, to avoid an issue where a WebSocket Server is created by Million for `vite dev` that isn't closed.
             * Which leaves `sanity build` hanging, even if the plugin itself isn't actually used.
             */
            require('@million/lint').vite(
              millionLintEverything
                ? {}
                : {
                    filter: {
                      include: millionInclude,
                    },
                  },
            ),
            ...(viteConfig.plugins || []),
          ]
        : viteConfig.plugins,
      optimizeDeps: {
        ...viteConfig.optimizeDeps,
        include: ['react/jsx-runtime'],
        exclude: [
          ...(viteConfig.optimizeDeps?.exclude || []),
          '@sanity/tsdoc',
          '@sanity/assist',
          'sanity',
          // This is needed to avoid a full page reload as vite discovers it while rendering the `./preview/index.html` iframe
          '@portabletext/toolkit',
        ],
      },
      resolve: reactProductionProfiling
        ? {
            ...viteConfig.resolve,
            alias: {
              ...viteConfig.resolve?.alias,
              'react-dom/client': require.resolve('react-dom/profiling'),
            },
          }
        : viteConfig.resolve,
      esbuild: reactProductionProfiling
        ? {
            ...viteConfig.esbuild,
            // Makes it much easier to look through profiling traces
            minifyIdentifiers: false,
          }
        : viteConfig.esbuild,
      build: {
        ...viteConfig.build,
        // Enable production source maps to easier debug deployed test studios
        sourcemap: reactProductionProfiling || viteConfig.build?.sourcemap,
        rollupOptions: {
          ...viteConfig.build?.rollupOptions,
          input: {
            // NOTE: this is required to build static files for the workshop frame
            'workshop/frame': path.resolve(__dirname, 'workshop/frame/index.html'),
            // NOTE: this is required to build static files for the presentation preview iframe
            'preview': path.resolve(__dirname, 'preview/index.html'),
          },
        },
      },
    }
  },
})
