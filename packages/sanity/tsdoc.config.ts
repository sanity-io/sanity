import {defineConfig} from '@sanity/tsdoc'
import pkgConfig from './package.config'

export default defineConfig({
  extract: pkgConfig.extract,
  output: {
    sanity: {
      projectId: process.env.EXTRACT_SANITY_PROJECT_ID,
      dataset: process.env.EXTRACT_SANITY_DATASET,
      token: process.env.EXTRACT_SANITY_WRITE_TOKEN,
    },
  },
})
