import {defineField, defineType} from 'sanity'

/**
 * A reusable named block content type with annotations that open in dialog modals.
 * Registered as a top-level schema type so locale fields can reference it by name.
 */
export const localeBlockContentType = defineType({
  name: 'localeBlockContentType',
  title: 'Block Content',
  type: 'array',
  of: [
    {
      type: 'block',
      marks: {
        annotations: [
          {
            name: 'internalLink',
            type: 'object',
            title: 'Internal link',
            options: {
              modal: {type: 'dialog'},
            },
            fields: [
              defineField({
                name: 'reference',
                type: 'reference',
                title: 'Reference',
                to: [{type: 'author'}],
              }),
            ],
          },
          {
            name: 'link',
            type: 'object',
            title: 'External link',
            options: {
              modal: {type: 'dialog'},
            },
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                title: 'URL',
              }),
            ],
          },
        ],
      },
    },
  ],
})

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

    {
      type: 'object',
      name: 'localeBlockContent',
      title: 'Localized block content',
      description:
        'Object with language keys, each referencing a named blockContent type. ' +
        'Used to reproduce broken breadcrumbs when opening annotation dialogs.',
      fields: [
        defineField({
          name: 'no',
          title: 'Norwegian',
          type: 'localeBlockContentType',
        }),
        defineField({
          name: 'en',
          title: 'English',
          type: 'localeBlockContentType',
        }),
        defineField({
          name: 'es',
          title: 'Spanish',
          type: 'localeBlockContentType',
        }),
      ],
    },
  ],
})
