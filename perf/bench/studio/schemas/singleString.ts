import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const singleStringWorkspace = {
  name: 'single-string-bench',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'singleString',
        type: 'document',
        fields: [defineField({name: 'stringField', type: 'string'})],
      }),
    ],
  },
} satisfies Partial<Config>
