import {defineConfig} from '@sanity/tsdoc'
import packageConfig from './package.config'

export default defineConfig({
  extract: packageConfig.extract,
  output: {
    sanity: {
      projectId: process.env.EXTRACT_SANITY_PROJECT_ID,
      dataset: process.env.EXTRACT_SANITY_DATASET,
      token: process.env.EXTRACT_SANITY_API_TOKEN,
    },
  },
})
