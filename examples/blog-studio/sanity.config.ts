import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from '../../packages/@sanity/cli/templates/blog/schemas'

export default defineConfig({
  name: 'default',
  title: 'Blog studio example',

  projectId: 'ppsg7ml5',
  dataset: 'blog',

  schema: {
    types: schemaTypes,
  },

  plugins: [deskTool()],
})
