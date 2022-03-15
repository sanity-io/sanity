import {createConfig} from '@sanity/base'
import {deskTool} from '@sanity/desk-tool'
import {config} from '../config'

export default createConfig({
  plugins: [
    deskTool({
      name: 'content',
      title: 'Content',
    }),
    deskTool({
      name: 'blog',
      title: 'Blog',
      source: 'blog',
    }),
  ],

  project: {
    basePath: '/multi-source',
    name: 'Multi Source',
  },

  sources: [
    {
      name: 'content',
      title: 'Content',
      projectId: config.sanity.projectId,
      dataset: 'test',
      initialValueTemplates: (T, {schema}) => T.defaults(schema),
      schemaTypes: [
        {
          type: 'document',
          name: 'author',
          title: 'Author',
          fields: [
            {
              type: 'string',
              name: 'name',
              title: 'Name',
            },
          ],
        },
      ],
    },

    {
      name: 'blog',
      title: 'Blog',
      projectId: config.sanity.projectId,
      dataset: 'test',
      initialValueTemplates: (T, {schema}) => T.defaults(schema),
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
          ],
        },
      ],
    },
  ],
})
