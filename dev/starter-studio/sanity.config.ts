import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

export default defineConfig({
  dataset: 'test',
  plugins: [deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  title: 'Starter Studio',
  schema: {
    types: [],
  },
})
