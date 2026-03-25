import {defineArrayMember, defineField, defineType} from 'sanity'

export const deepNestedAccordion = defineType({
  title: 'Accordion',
  name: 'deepNested.accordion',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      type: 'array',
      validation: (rule) => rule.min(1).required(),
      options: {
        layout: 'tags',
      },
      of: [
        defineArrayMember({
          name: 'item',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare: (value) => {
      return {
        title: 'Accordion',
        subtitle: `With ${value.items?.length ?? 0} items`,
      }
    },
  },
})

export const deepNestedRichContent = defineType({
  title: 'Rich content',
  name: 'deepNested.richContentEditor',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'deepNested.accordion',
    }),
    defineArrayMember({
      type: 'block',
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
      },
      styles: [
        {title: 'Paragraph', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
      ],
    }),
  ],
})

export const deepNestedContent = defineType({
  title: 'Content',
  type: 'object',
  name: 'deepNested.content',
  fields: [
    defineField({
      name: 'text',
      type: 'deepNested.richContentEditor',
    }),
  ],
})

export const deepNestedRow = defineType({
  title: 'Row',
  name: 'deepNested.row',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      type: 'array',
      options: {
        layout: 'grid',
      },
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          type: 'deepNested.content',
        }),
      ],
    }),
  ],
})

export const deepNestedBody = defineType({
  title: 'Body sections',
  name: 'deepNested.body',
  type: 'array',
  of: [
    defineArrayMember({type: 'deepNested.row'}),
    defineArrayMember({type: 'deepNested.content'}),
  ],
})
