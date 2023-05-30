import {defineConfig} from '@sanity/tsdoc'
import packageConfig from './package.config'

export default defineConfig({
  extract: packageConfig.extract,
  output: {
    sanity: {
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      token: process.env.SANITY_TOKEN,
    },
  },
})
