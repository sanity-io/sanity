import {createConfig} from '@sanity/base'
import {codeInput} from '@sanity/code-input'
import {deskTool} from '@sanity/desk-tool'
import {schemaTypes} from './schemas'

export default createConfig({
  plugins: [codeInput(), deskTool()],
  project: {name: 'SanityTest'},
  sources: [
    {
      name: 'default',
      title: 'Default',
      projectId: 'q2r21cu7',
      dataset: 'example',
      schemaTypes,
    },
  ],
})
