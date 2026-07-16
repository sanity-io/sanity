import {defineConfig, mergeConfig} from 'vite'

// Relative path so Vite's default config loader can bundle this file when
// `@sanity/vanilla-extract-vite-plugin` reloads the config for its compiler server
// (`@repo/package.bundle` resolves to raw `.ts` and is externalized otherwise).
import {defaultConfig} from '../../@repo/package.bundle/src/package.bundle'

export default defineConfig(() => {
  return mergeConfig(defaultConfig, {
    build: {
      lib: {
        entry: {
          index: './src/index.ts',
        },
      },
    },
  })
})
