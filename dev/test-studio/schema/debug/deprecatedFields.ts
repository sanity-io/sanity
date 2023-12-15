import {defineField, defineType} from 'sanity'

export const deprecatedFields = defineType({
  name: 'deprecatedFields',
  title: 'Deprecated Fields',
  type: 'document',
  fields: [
    defineField({
      deprecated: {
        reason: 'This string field is deprecated',
      },
      name: 'string',
      title: 'Deprecated String',
      type: 'string',
    }),
    defineField({
      deprecated: {
        reason: 'This string list is deprecated',
      },
      name: 'type',
      type: 'string',
      title: 'Deprecated List',
      initialValue: 'foo',
      options: {list: ['Frukt', 'Dyr', 'Fjell']},
    }),
    defineField({
      deprecated: {
        reason: 'This number field is deprecated',
      },
      name: 'number',
      title: 'Deprecated Number',
      type: 'number',
    }),
    defineField({
      deprecated: {
        reason: 'This boolean field is deprecated',
      },
      name: 'boolean',
      title: 'Deprecated Boolean',
      type: 'boolean',
    }),
    defineField({
      deprecated: {
        reason: 'This email field is deprecated',
      },
      name: 'email',
      title: 'Deprecated Email',
      type: 'email',
    }),
    defineField({
      deprecated: {
        reason: 'This array is deprecated',
      },
      name: 'array',
      title: 'Deprecated Array String',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'notDeprecatedObject',
      title: 'Not Deprecated Object',
      type: 'object',
      fields: [
        defineField({
          name: 'notDeprecated',
          title: 'Not deprecated',
          type: 'email',
        }),
        defineField({
          name: 'deprecated',
          deprecated: {
            reason: 'This field in object is deprecated',
          },
          title: 'Deprecated in Object',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'DeprecatedObject',
      title: 'Deprecated Object',
      deprecated: {
        reason: 'This object is deprecated',
      },
      type: 'object',
      fields: [
        defineField({
          name: 'notDeprecated',
          title: 'Not deprecated',
          type: 'email',
        }),
        defineField({
          name: 'deprecated',
          title: 'Deprecated in Object',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'reference',
      deprecated: {
        reason: 'This reference is deprecated',
      },
      title: 'Deprecated Reference',
      type: 'reference',
      to: [{type: 'author'}, {type: 'book'}],
    }),
    defineField({
      name: 'cdReference',
      deprecated: {
        reason: 'This cross dataset reference is deprecated',
      },
      title: 'Deprecated CDR',
      type: 'crossDatasetReference',
      dataset: 'blog',
      to: [{type: 'author', preview: {select: {title: 'name'}}}],
    }),
    defineField({
      name: 'image',
      deprecated: {
        reason: 'This image is deprecated',
      },
      title: 'Deprecated Image',
      type: 'image',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'file',
      deprecated: {
        reason: 'This file is deprecated',
      },
      title: 'Deprecated File',
      type: 'file',
      fields: [
        defineField({
          name: 'description',
          title: 'description',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'date',
      deprecated: {
        reason: 'This date is deprecated',
      },
      title: 'Deprecated Date',
      type: 'date',
    }),
    defineField({
      name: 'datetime',
      deprecated: {
        reason: 'This datetime is deprecated',
      },
      title: 'Deprecated DateTime',
      type: 'datetime',
    }),
    defineField({
      name: 'geopoint',
      deprecated: {
        reason: 'This geopoint is deprecated',
      },
      title: 'Deprecated Geopoint',
      type: 'geopoint',
    }),
    defineField({
      name: 'url',
      title: 'Deprecated URL',
      type: 'url',
      deprecated: {
        reason: 'This url is deprecated',
      },
    }),
    defineField({
      name: 'slug',
      deprecated: {
        reason: 'This slug is deprecated',
      },
      title: 'Deprecated Slug',
      type: 'slug',
      options: {source: 'string'},
    }),
    defineField({
      name: 'text',
      deprecated: {
        reason: 'This text is deprecated',
      },
      title: 'Deprecated Text',
      type: 'text',
    }),
    defineField({
      name: 'blocks',
      deprecated: {
        reason: 'This blocks is deprecated',
      },
      title: 'Deprecated Blocks',
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}],
    }),
  ],
})
