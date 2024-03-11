import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  extract: {
    rules: {
      'ae-missing-release-tag': 'off',
      // do not require internal members to be prefixed with `_`
      'ae-internal-missing-underscore': 'off',
    },
  },
  // the path to the tsconfig file for distributed builds
  tsconfig: 'tsconfig.dist.json',
  legacyExports: true,
})
