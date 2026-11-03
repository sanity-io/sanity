import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

import {EmptyTool} from '../components/emptyTool'

export const softNavWorkspace = {
  name: 'soft-nav-bench',
  plugins: [structureTool()],
  tools: [{name: 'empty', title: 'Empty', component: EmptyTool}],
  schema: {
    types: [
      defineType({
        name: 'post',
        type: 'document',
        fields: [
          defineField({name: 'title', type: 'string'}),
          defineField({name: 'summary', type: 'text', rows: 3}),
          defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
          defineField({name: 'tags', type: 'array', of: [{type: 'string'}]}),
          defineField({name: 'body', type: 'array', of: [{type: 'block'}]}),
        ],
      }),
    ],
  },
} satisfies Partial<Config>
