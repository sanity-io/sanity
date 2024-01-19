import {defineField, defineType} from 'sanity'

export const namedDeprecatedObject = {
  type: 'object',
  name: 'namedDeprecatedObject',
  fields: [{type: 'string', name: 'foo'}],
}

export const namedDeprecatedArray = {
  type: 'array',
  name: 'namedDeprecatedArray',
  of: [{type: 'string'}],
}

export const deprecatedFields = defineType({
  name: 'deprecatedFields',
  title: 'Deprecated Fields',
  type: 'document',
  fields: [
    defineField({
      name: 'namedDeprecatedObject',
      title: 'namedDeprecatedObject',
      deprecated: {
        reason: 'This string field is deprecated',
      },
      type: 'namedDeprecatedObject',
    }),
    defineField({
      name: 'namedDeprecatedArray',
      title: 'namedDeprecatedArray',
      deprecated: {
        reason: 'This string field is deprecated',
      },
      type: 'namedDeprecatedArray',
    }),
    defineField({
      deprecated: {
        reason:
          'Use the non deprecated string field for new content, this field was originally for the old frontend',
      },
      description: 'This field is used to create the header for the site',
      validation: (Rule) => Rule.required(),
      name: 'string',
      title: 'string',
      type: 'string',
    }),
    defineField({
      deprecated: {
        reason: 'This string list is deprecated',
      },
      name: 'type',
      type: 'string',
      title: 'list',
      initialValue: 'foo',
      options: {list: ['Frukt', 'Dyr', 'Fjell']},
    }),
    defineField({
      deprecated: {
        reason: 'This number field is deprecated',
      },
      name: 'number',
      title: 'number',
      type: 'number',
    }),
    defineField({
      deprecated: {
        reason: 'This boolean field is deprecated',
      },
      name: 'boolean',
      title: 'boolean',
      type: 'boolean',
    }),
    defineField({
      deprecated: {
        reason: 'This email field is deprecated',
      },
      name: 'email',
      title: 'email',
      type: 'email',
    }),
    defineField({
      deprecated: {
        reason: 'This array is deprecated',
      },
      name: 'array',
      title: 'array',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'notDeprecatedObject',
      title: 'Not Object',
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
          title: 'in Object',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'DeprecatedObject',
      title: 'object',
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
          title: 'in Object',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'reference',
      deprecated: {
        reason: 'This reference is deprecated',
      },
      title: 'reference',
      type: 'reference',
      to: [{type: 'author'}, {type: 'book'}, {type: 'deprecatedDocument'}],
    }),
    defineField({
      name: 'cdReference',
      deprecated: {
        reason: 'This cross dataset reference is deprecated',
      },
      title: 'crossDatasetReference',
      type: 'crossDatasetReference',
      dataset: 'blog',
      to: [{type: 'author', preview: {select: {title: 'name'}}}],
    }),
    defineField({
      name: 'image',
      deprecated: {
        reason: 'This image is deprecated',
      },
      title: 'image',
      type: 'image',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Deprecated',
          type: 'string',
          deprecated: {
            reason: 'This alt is deprecated',
          },
        }),
      ],
    }),
    defineField({
      name: 'file',
      deprecated: {
        reason: 'This file is deprecated',
      },
      title: 'file',
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
      title: 'date',
      type: 'date',
    }),
    defineField({
      name: 'datetime',
      deprecated: {
        reason: 'This datetime is deprecated',
      },
      title: 'datetime',
      type: 'datetime',
    }),
    defineField({
      name: 'geopoint',
      deprecated: {
        reason: 'This geopoint is deprecated',
      },
      title: 'geopoint',
      type: 'geopoint',
    }),
    defineField({
      name: 'url',
      title: 'url',
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
      title: 'slug',
      type: 'slug',
      options: {source: 'string'},
    }),
    defineField({
      name: 'text',
      deprecated: {
        reason: 'This text is deprecated',
      },
      title: 'text',
      type: 'text',
    }),
    defineField({
      name: 'blocks',
      deprecated: {
        reason: 'This blocks is deprecated',
      },
      title: 'Blocks',
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}],
    }),
  ],
})
