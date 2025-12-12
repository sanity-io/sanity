import * as vitest from 'vitest/config'
import {configDefaults} from 'vitest/config'

/**
 *
 * @param [config] {vitest.UserConfig}
 * @return {vitest.UserConfig}
 */
export function defineConfig(config) {
  return vitest.defineConfig({
    ...config,
    test: {
      ...config?.test,
      typecheck: {
        ...config?.test?.typecheck,
        exclude: [
          ...(configDefaults.typecheck?.exclude || []),
          '.tmp/**',
          './lib/**',
          ...(config?.test?.typecheck?.exclude || []),
        ],
      },
      exclude: [...configDefaults.exclude, '.tmp/**', './lib/**', ...(config?.test?.exclude || [])],
    },
  })
}
