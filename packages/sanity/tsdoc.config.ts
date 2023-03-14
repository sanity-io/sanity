import {defineConfig} from '@sanity/tsdoc'

export default defineConfig({
  output: {
    sanity: {
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      token: process.env.SANITY_TOKEN,
    },
  },
})
