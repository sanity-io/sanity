import {defineCliConfig} from 'sanity/cli'
import {type UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'page-building',
  },
  reactCompiler: {target: '18'},
  vite(viteConfig: UserConfig): UserConfig {
    return {
      ...viteConfig,
      esbuild: {
        ...viteConfig.esbuild,
        minifyIdentifiers: false,
      },
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...viteConfig.resolve?.alias,
          'react-dom/client': require.resolve('react-dom/profiling'),
        },
      },
    }
  },
})
