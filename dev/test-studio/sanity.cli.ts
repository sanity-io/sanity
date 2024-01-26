import path from 'path'
import {defineCliConfig} from 'sanity/cli'
import {UserConfig} from 'vite'
import viteReact from '@vitejs/plugin-react'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },

  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false yarn dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  warnUnknownForwardedProps: true,
  vite(viteConfig: UserConfig): UserConfig {
    return {
      ...viteConfig,
      // override the default react plugin to use a different runtime on demand
      plugins:
        // eslint-disable-next-line no-process-env
        process.env.WHY_DID_YOU_RENDER === 'true'
          ? [
              viteReact({jsxImportSource: '@welldone-software/why-did-you-render'}),
              ...(viteConfig.plugins || []),
            ]
          : viteConfig.plugins,
      optimizeDeps: {
        ...viteConfig.optimizeDeps,
        include: ['react/jsx-runtime'],
        exclude: [...(viteConfig.optimizeDeps?.exclude || []), '@sanity/tsdoc', '@sanity/assist'],
      },
      build: {
        ...viteConfig.build,
        rollupOptions: {
          ...viteConfig.build?.rollupOptions,
          input: {
            // NOTE: this is required to build static files for the workshop frame
            'workshop/frame': path.resolve(__dirname, 'workshop/frame/index.html'),
          },
        },
      },
    }
  },
})
