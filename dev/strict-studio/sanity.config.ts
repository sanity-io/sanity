import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {schemaTypes} from './schema'

export default defineConfig({
  plugins: [deskTool()],
  title: 'Strict',
  name: 'default',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {types: schemaTypes},
})
