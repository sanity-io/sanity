import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

export default defineConfig({
  dataset: 'test',
  plugins: [structureTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  title: 'Starter Studio',
  schema: {
    types: [],
  },
})
