import {defineField, defineType} from 'sanity'

export const deprecatedDocument = defineType({
  name: 'deprecatedDocument',
  title: 'Deprecated Document',
  type: 'document',
  deprecated: {
    reason: 'This document type is deprecated, use the author document',
  },
  fields: [
    defineField({
      description: 'This field is used to create the header for the site',
      validation: (Rule) => Rule.required(),
      name: 'string',
      title: 'string',
      type: 'string',
    }),
  ],
})
