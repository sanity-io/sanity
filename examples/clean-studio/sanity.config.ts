import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from '../../packages/@sanity/cli/templates/clean/schemas'

export default createConfig({
  name: 'default',
  title: 'Clean studio',

  projectId: 'ppsg7ml5',
  dataset: 'clean',

  schema: {
    types: schemaTypes,
  },

  plugins: [deskTool()],
})
