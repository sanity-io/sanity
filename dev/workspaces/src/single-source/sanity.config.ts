import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {config} from '../config'

export default createConfig({
  plugins: [deskTool({})],
  project: {
    basePath: '/single-source',
    name: 'Single Source',
  },
  sources: [
    {
      name: 'default',
      title: 'Default',
      projectId: config.sanity.projectId,
      dataset: 'test',
      schemaTypes: [],
    },
  ],
})
