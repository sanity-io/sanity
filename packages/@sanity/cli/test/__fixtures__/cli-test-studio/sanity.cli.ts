import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  project: {basePath: '/config-base-path'},
  graphql: [{playground: false}],
  ...(process.env.SANITY_CLI_TEST_TYPEGEN === '1'
    ? {
        typegen: {
          enabled: true,
          schema: process.env.SANITY_CLI_TEST_TYPEGEN_SCHEMA_PATH || 'schema.json',
          generates: process.env.SANITY_CLI_TEST_TYPEGEN_OUTPUT_PATH || 'sanity.types.ts',
        },
      }
    : {}),
  ...(process.env.SANITY_CLI_TEST_SCHEMA_EXTRACTION === '1'
    ? {
        schemaExtraction: {
          enabled: true,
          path: process.env.SANITY_CLI_TEST_SCHEMA_EXTRACTION_PATH || 'schema.json',
        },
      }
    : {}),
})
