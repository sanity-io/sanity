import {defineCliConfig} from 'sanity/cli'

/**
 *
 * This is the configuration for the project and dataset where the Sanity Team tests the functions.
 *
 */
export default defineCliConfig({
  api: {
    projectId: 'cgd8g1dj',
    dataset: 'production',
  },
})
