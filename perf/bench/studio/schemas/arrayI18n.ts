import {type Config, defineField, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {structureTool} from 'sanity/structure'

// Ported from dev/efps/tests/arrayI18n/sanity.config.ts
export const arrayI18nWorkspace = {
  name: 'array-i18n-bench',
  plugins: [
    structureTool(),
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
    }),
  ],
  schema: {
    types: [
      defineType({
        name: 'arrayI18n',
        type: 'document',
        fields: [
          defineField({name: 'simple', type: 'internationalizedArrayString'}),
          ...Array.from({length: 30}, (_, i) =>
            defineField({
              name: `field${i}`,
              type: 'internationalizedArrayString',
            }),
          ),
        ],
      }),
    ],
  },
} satisfies Partial<Config>
