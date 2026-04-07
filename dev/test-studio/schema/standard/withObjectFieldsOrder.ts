import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'withObjectFieldsOrder',
  type: 'document',
  title: 'With object fields order',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'publicationYear',
      type: 'number',
      title: 'Publication year',
    },
    {
      name: 'translations',
      type: 'object',
      title: 'Translations',
      fields: [
        {name: 'se', type: 'string', title: 'Swedish title'},
        {name: 'no', type: 'string', title: 'Norwegian title'},
      ],
    },
    {
      name: 'vehicleModel',
      type: 'object',
      title: 'Vehicle model',
      fields: [
        {name: 'make', type: 'string', title: 'Make'},
        {name: 'model', type: 'string', title: 'Model'},
      ],
    },
    {
      name: 'author',
      type: 'reference',
      to: [{type: 'author'}],
    },
    {
      name: 'coverImage',
      type: 'image',
      options: {hotspot: true},
    },
    defineField({
      name: 'relatedAuthors',
      title: 'Related authors',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'author'}],
        }),
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [defineField({name: 'label', title: 'Label', type: 'string'})],
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Publication year',
      name: 'publicationYearDesc',
      by: [{field: 'publicationYear', direction: 'desc'}],
    },
    {
      title: 'Swedish, then Norwegian',
      name: 'swedishThenNorwegian',
      by: [
        {field: 'translations.se', direction: 'asc'},
        {field: 'translations.no', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
    {
      title: 'Norwegian, then Swedish',
      name: 'norwegianThenSwedish',
      by: [
        {field: 'translations.no', direction: 'asc'},
        {field: 'translations.se', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
    {
      title: 'Make first',
      name: 'makeFirst',
      by: [
        {field: 'vehicleModel.make', direction: 'asc'},
        {field: 'vehicleModel.model', direction: 'asc'},
      ],
    },
    {
      title: 'Model first',
      name: 'modelFirst',
      by: [
        {field: 'vehicleModel.model', direction: 'asc'},
        {field: 'vehicleModel.make', direction: 'asc'},
      ],
    },
    {
      title: 'Author name',
      name: 'authorName',
      by: [{field: 'author.name', direction: 'asc'}],
    },
    {
      title: 'Cover image size',
      name: 'coverImageSize',
      by: [{field: 'coverImage.asset.size', direction: 'asc'}],
    },
    {
      title: 'First related author name (asc)',
      name: 'firstRelatedAuthorAsc',
      by: [{field: 'relatedAuthors[0].name', direction: 'asc'}],
    },
    {
      title: 'First tag label (asc)',
      name: 'firstTagLabelAsc',
      by: [{field: 'tags[0].label', direction: 'asc'}],
    },
    {
      title: 'Updated at, then title',
      name: 'updatedAtThenTitle',
      by: [
        {field: '_updatedAt', direction: 'desc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      se: 'translations.se',
      no: 'translations.no',
      make: 'vehicleModel.make',
      model: 'vehicleModel.model',
    },
    prepare({title, se, no, make, model}) {
      return {
        title: title || se || no || '(untitled)',
        subtitle: [make, model].filter(Boolean).join(' - '),
      }
    },
  },
})
