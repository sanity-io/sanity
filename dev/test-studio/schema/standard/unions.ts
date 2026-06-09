import {ComposeIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const unionTestHero = defineType({
  name: 'unionTestHero',
  type: 'object',
  title: 'Hero',
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
    }),
    defineField({
      name: 'tagline',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'tagline',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Hero',
        subtitle,
      }
    },
  },
})

export const unionTestCallout = defineType({
  name: 'unionTestCallout',
  type: 'object',
  title: 'Callout',
  fields: [
    defineField({
      name: 'message',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'tone',
      type: 'string',
      options: {
        list: [
          {title: 'Info', value: 'info'},
          {title: 'Success', value: 'success'},
          {title: 'Warning', value: 'warning'},
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'message',
      subtitle: 'tone',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Callout',
        subtitle,
      }
    },
  },
})

export const unionTestQuote = defineType({
  name: 'unionTestQuote',
  type: 'object',
  title: 'Quote',
  fields: [
    defineField({
      name: 'quote',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'attribution',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'quote',
      subtitle: 'attribution',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Quote',
        subtitle,
      }
    },
  },
})

export const unionTestProductTeaser = defineType({
  name: 'unionTestProductTeaser',
  type: 'object',
  title: 'Product teaser',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'linkLabel',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'linkLabel',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Product teaser',
        subtitle,
      }
    },
  },
})

export const unionTestContentBlock = defineType({
  name: 'unionTestContentBlock',
  type: 'union',
  title: 'Content block',
  of: [
    {type: 'unionTestHero'},
    {type: 'unionTestCallout'},
    {type: 'unionTestQuote'},
    {type: 'unionTestProductTeaser'},
  ],
})

export const unionTestPrimaryBlock = defineType({
  name: 'unionTestPrimaryBlock',
  type: 'union',
  title: 'Primary block',
  of: [{type: 'unionTestHero'}, {type: 'unionTestCallout'}],
})

export const unionTestEditorialBlock = defineType({
  name: 'unionTestEditorialBlock',
  type: 'union',
  title: 'Editorial block',
  of: [{type: 'unionTestQuote'}, {type: 'unionTestProductTeaser'}],
})

export const unionTestMergedBlock = defineType({
  name: 'unionTestMergedBlock',
  type: 'union',
  title: 'Merged block',
  of: [{type: 'unionTestHero'}, {type: 'unionTestCallout'}, {type: 'unionTestEditorialBlock'}],
})

export const unionTestReferenceTarget = defineType({
  name: 'unionTestReferenceTarget',
  type: 'union',
  title: 'Reference target',
  of: [{type: 'book'}, {type: 'author'}],
})

export const unionTestTypes = [
  unionTestHero,
  unionTestCallout,
  unionTestQuote,
  unionTestProductTeaser,
  unionTestContentBlock,
  unionTestPrimaryBlock,
  unionTestEditorialBlock,
  unionTestMergedBlock,
  unionTestReferenceTarget,
]

export default defineType({
  name: 'unionsTest',
  type: 'document',
  title: 'Unions test',
  icon: ComposeIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'contentBlock',
      title: 'One of many object types',
      type: 'unionTestContentBlock',
    }),
    defineField({
      name: 'mergedBlock',
      title: 'Merged object union',
      type: 'unionTestMergedBlock',
    }),
    defineField({
      name: 'featuredReference',
      title: 'Reference using document union',
      type: 'reference',
      to: [{type: 'unionTestReferenceTarget'}],
    }),
    defineField({
      name: 'blockList',
      title: 'Array using object union',
      type: 'array',
      of: [defineArrayMember({type: 'unionTestPrimaryBlock'})],
    }),
    defineField({
      name: 'referenceList',
      title: 'Array of references using document union',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'unionTestReferenceTarget'}],
        }),
      ],
    }),
    defineField({
      name: 'mergedBlockList',
      title: 'Array using merged object union',
      type: 'array',
      of: [defineArrayMember({type: 'unionTestMergedBlock'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Unions test',
      }
    },
  },
})
