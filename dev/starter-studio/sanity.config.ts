import {createConfig, deskTool} from 'sanity'
import {postDocumentType} from './schema/post'

export default createConfig({
  dataset: 'test',
  plugins: [deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  schema: {
    types: [postDocumentType],
  },
  title: 'Starter Studio',
})
