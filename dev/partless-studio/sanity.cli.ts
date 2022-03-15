import path from 'path'
import {createCliConfig} from '@sanity/cli'
import {UserConfig} from 'vite'

const SRC_PATH = path.resolve(__dirname, 'src')

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export default createCliConfig({
  api: {
    projectId: 'ppsg7ml5',
  },

  vite: (viteConfig: UserConfig): UserConfig => {
    return {
      ...viteConfig,

      root: SRC_PATH,

      build: {
        ...viteConfig.build,
        rollupOptions: {
          ...viteConfig.build?.rollupOptions,
          input: {
            ...(isRecord(viteConfig.build?.rollupOptions?.input)
              ? viteConfig.build?.rollupOptions?.input
              : {}),
            'plugins/workshop/frame': path.resolve(SRC_PATH, 'plugins/workshop/frame/index.html'),
          },
        },
      },
    }
  },
})
