import path from 'path'
import {createCliConfig} from '@sanity/cli'
import {UserConfig} from 'vite'

export default createCliConfig({
  api: {
    projectId: 'ppsg7ml5',
  },

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
