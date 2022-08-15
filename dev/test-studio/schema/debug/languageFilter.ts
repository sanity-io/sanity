import {defineType} from 'sanity'

export const languageFilterDebugType = defineType({
  type: 'document',
  name: 'languageFilterDebug',
  title: 'Debug: language-filter',

  fieldsets: [
    {
      name: 'test',
      title: 'Test',
      options: {
        collapsible: true,
      },
    },
  ],

  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'string',
      name: 'test',
      title: 'Test',
      fieldset: 'test',
    },

    {
      type: 'object',
      name: 'localeTitle',
      title: 'Localized title',

      fields: [
        {
          type: 'string',
          name: 'ar',
          title: 'Arabic',
        },
        {
          type: 'string',
          name: 'en',
          title: 'English',
        },
        {
          type: 'string',
          name: 'nb',
          title: 'Norwegian (Bokmål)',
        },
        {
          type: 'string',
          name: 'nn',
          title: 'Norwegian (Nynorsk)',
        },
        {
          type: 'string',
          name: 'pt',
          title: 'Portuguese',
        },
        {
          type: 'string',
          name: 'es',
          title: 'Spanish',
        },
      ],
    },
  ],
})
