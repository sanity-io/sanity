import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {config} from '../config'
import {codeInput} from './plugins/code-input'

export default createConfig({
  plugins: [codeInput(), deskTool()],
  project: {
    basePath: '/plugin-schema-types',
    name: 'Plugin schema types',
  },
  sources: [
    {
      name: 'default',
      title: 'Default',
      projectId: config.sanity.projectId,
      dataset: 'test',
      schemaTypes: [
        {
          type: 'document',
          name: 'post',
          title: 'Post',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
            {
              type: 'code',
              name: 'codeExampe',
            },
            {
              type: 'code',
              name: 'codeExample',
            },
          ],
        },
      ],
    },
  ],
})
