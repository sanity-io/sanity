import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const minimal = {
  name: 'minimal',
  title: 'Minimal',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'simpleDoc',
        title: 'Simple Document',
        type: 'document',
        fields: [defineField({name: 'title', type: 'string'})],
      }),
    ],
  },
} satisfies Partial<Config>
