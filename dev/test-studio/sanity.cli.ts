import path from 'node:path'

import {defineCliConfig} from 'sanity/cli'
import {type UserConfig} from 'vite'

const millionLintEnabled = process.env.REACT_MILLION_LINT === 'true'
const millionInclude: string[] = []
try {
  if (millionLintEnabled) {
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
  reactCompiler: millionLintEnabled
    ? {
        target: '18',
        sources: (filename) => {
          if (filename.includes('node_modules')) {
            return false
          }
          return millionInclude.every(
            (pattern) => !filename.endsWith(`/${pattern.split('**/')[1]}`),
          )
        },
      }
    : {target: '18'},
  vite(viteConfig: UserConfig): UserConfig {
    const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

    return {
      ...viteConfig,
      plugins: millionLintEnabled
        ? [
            require('@million/lint').vite({
              filter: {
                include: millionInclude,
              },
            }),
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
