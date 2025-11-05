import {defineCliConfig} from 'sanity/cli'
import {type UserConfig} from 'vite'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'page-building',
  },
  reactCompiler: {target: '19'},
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
          // oxlint-disable-next-line no-misused-spread
          ...viteConfig.resolve?.alias,
          'react-dom/client': require.resolve('react-dom/profiling'),
        },
      },
    }
  },
})
