import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const commentsFieldWorkspace = {
  name: 'comments-field-bench',
  plugins: [structureTool()],
  schema: {
    types: [
      defineType({
        name: 'commentsField',
        type: 'document',
        fields: [defineField({name: 'stringField', type: 'string'})],
      }),
    ],
  },
} satisfies Partial<Config>
