import path from 'node:path'

import {defineCliConfig} from 'sanity/cli'
import {type UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },

  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false pnpm dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  vite(viteConfig: UserConfig): UserConfig {
    return {
      ...viteConfig,
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
      build: {
        ...viteConfig.build,
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
