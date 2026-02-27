import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

export const singleStringEfps = {
  name: 'single-string-efps',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Single String Documents')
              .child(S.documentTypeList('singleString').title('Single String Documents')),
          ]),
    }),
  ],
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
