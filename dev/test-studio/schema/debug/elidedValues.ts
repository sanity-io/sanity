import {defineField, defineType} from 'sanity'

export const elidedValuesExample = defineType({
  type: 'document',
  name: 'elidedValues',
  title: 'Elided values',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
    }),
    defineField({
      type: 'boolean',
      elideIf: false,
      name: 'elideIfFalse',
      title: 'This value will be elided if false',
    }),
    defineField({
      type: 'boolean',
      elideIf: true,
      name: 'elideIfTrue',
      title: 'This value will be elided if true',
    }),
    defineField({
      type: 'boolean',
      name: 'noElision',
      title: 'This value has no elision config and will be indeterminate if undefined',
    }),
    defineField({
      type: 'string',
      elideIf: 'x',
      name: 'elidedString',
    }),
    defineField({
      type: 'string',
      elideIf: '',
      name: 'elideEmptyString',
    }),
    defineField({
      type: 'number',
      elideIf: 1,
      name: 'elidedNumber',
    }),
  ],
})
