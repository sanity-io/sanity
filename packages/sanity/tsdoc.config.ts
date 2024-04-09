import {defineConfig} from '@sanity/tsdoc'

import packageConfig from './package.config'

export default defineConfig({
  extract: packageConfig.extract,
  legacyExports: packageConfig.legacyExports,
  output: {
    sanity: {
      projectId: process.env.EXTRACT_SANITY_PROJECT_ID,
      dataset: process.env.EXTRACT_SANITY_DATASET,
      token: process.env.EXTRACT_SANITY_API_TOKEN,
    },
  },
  input: {
    type: 'fs',
    bundledPackages: ['@sanity/types', '@sanity/migrate'],
    tsconfig: 'tsconfig.tsdoc.json',
  },
})
