import {codeInput} from '@sanity/code-input'
import {createConfig, deskTool} from 'sanity'
import {authorDocumentType} from './schema/author'
import {postDocumentType} from './schema/post'

export default createConfig({
  dataset: 'test',
  plugins: [codeInput(), deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  schema: {
    types: [authorDocumentType, postDocumentType],
  },
  title: 'Starter Studio',
})
