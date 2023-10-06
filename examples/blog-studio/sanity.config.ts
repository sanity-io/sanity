import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from '../../packages/@sanity/cli/templates/blog/schemas'

export default defineConfig({
  name: 'default',
  title: 'Blog studio example',

  projectId: '50lyhgrn',
  dataset: 'production',
  apiHost: 'https://api.sanity.work',

  schema: {
    types: schemaTypes,
  },

  plugins: [deskTool()],
})
