import {configDefaults, defineConfig} from 'vitest/config'

import {getAliases} from '../../../vitest-aliases'

export default defineConfig({
  test: {
    alias: getAliases(),
    typecheck: {
      exclude: [...(configDefaults.typecheck?.exclude || []), '.tmp/**', './lib/**'],
    },
    exclude: [...configDefaults.exclude, '.tmp/**', './lib/**'],
    includeSource: ['./src/**/*.ts'],
  },
})
