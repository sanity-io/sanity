import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import strings from './schema/primitives/strings'

export default defineConfig({
  dataset: 'e2e',
  plugins: [deskTool()],
  name: 'default',
  projectId: 'bamh7ux3',
  title: 'e2e Studio',
  schema: {
    types: [strings],
  },
})
