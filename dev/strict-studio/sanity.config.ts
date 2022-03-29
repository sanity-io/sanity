import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {schemaTypes} from './schema'

export default createConfig({
  plugins: [deskTool()],
  project: {name: 'Strict'},
  sources: [
    {
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'test',
      title: 'Default',
      schemaTypes,
    },
  ],
})
