import path from 'path'
import {defineCliConfig} from 'sanity/cli'
import {UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },

  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false yarn dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  vite(viteConfig: UserConfig): UserConfig {
    return {
      ...viteConfig,
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
