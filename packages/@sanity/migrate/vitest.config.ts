import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    typecheck: {
      exclude: [...(configDefaults.typecheck?.exclude || []), '.tmp/**'],
    },
    exclude: [...configDefaults.exclude, '.tmp/**'],
    includeSource: ['./src/**/*.ts'],
  },
})
