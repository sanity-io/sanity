import {defineType} from 'sanity'

export const deprecatedFields = defineType({
  name: 'deprecatedFields',
  title: 'Deprecated Fields',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      deprecated: {
        reason: 'This string field is deprecated',
      },
    },
    {
      title: 'Number',
      name: 'number',
      type: 'number',
      deprecated: {
        reason: 'This number field is deprecated',
      },
    },
    {
      title: 'Boolean',
      name: 'boolean',
      type: 'boolean',
      deprecated: {
        reason: 'This boolean field is deprecated',
      },
    },
    {
      title: 'Date',
      name: 'date',
      type: 'date',
      deprecated: {
        reason: 'This date field is deprecated',
      },
    },
    {
      name: 'arrayOfReferences',
      title: 'Array of References',
      type: 'array',
      deprecated: {
        reason: 'This array of references field is deprecated',
      },
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'arrayOfStrings',
      title: 'Array of Strings',
      type: 'array',
      deprecated: {
        reason: 'This array of strings field is deprecated',
      },
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'objectFullDeprecated',
      title: 'Object Complete Deprecated',
      type: 'object',
      deprecated: {
        reason: 'This object field is deprecated',
      },
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
      ],
    },
    {
      name: 'objectFieldDeprecated',
      title: 'Object Field Deprecated',
      type: 'object',
      fields: [
        {
          name: 'notDeprecated',
          title: 'Not Deprecated',
          type: 'string',
        },
        {
          name: 'deprecated',
          title: 'Deprecated',
          type: 'string',
          deprecated: {
            reason: 'This object field is deprecated',
          },
        },
      ],
    },
  ],
})
