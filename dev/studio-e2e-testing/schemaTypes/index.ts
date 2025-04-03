import {createSchemaTypes} from 'sanity-test-studio/schema'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!

export const schemaTypes = createSchemaTypes(projectId)
