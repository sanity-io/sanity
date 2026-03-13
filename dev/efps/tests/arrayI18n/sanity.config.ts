import {type Config, defineField, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {structureTool} from 'sanity/structure'

export const arrayI18nEfps = {
  name: 'array-i18n-efps',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Array I18N Documents')
              .child(S.documentTypeList('arrayI18n').title('Array I18N Documents')),
          ]),
    }),
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
