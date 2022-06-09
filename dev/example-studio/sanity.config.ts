import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {codeInput} from '@sanity/code-input'
import {schemaTypes} from './schemas'

export default createConfig({
  plugins: [codeInput(), deskTool()],
  name: 'default',
  title: 'SanityTest',
  projectId: 'q2r21cu7',
  dataset: 'example',
  schema: {types: schemaTypes},
})
