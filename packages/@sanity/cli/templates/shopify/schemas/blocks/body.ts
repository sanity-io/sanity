import {defineArrayMember, defineType} from 'sanity'

export default defineType({
  name: 'body',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        annotations: [
          // Product
          {
            name: 'annotationProduct',
            type: 'annotationProduct',
          },
          // Email
          {
            name: 'annotationLinkEmail',
            type: 'annotationLinkEmail',
          },
          // Internal link
          {
            name: 'annotationLinkInternal',
            type: 'annotationLinkInternal',
          },
          // URL
          {
            name: 'annotationLinkExternal',
            type: 'annotationLinkExternal',
          },
        ],
        decorators: [
          {
            title: 'Italic',
            value: 'em',
          },
          {
            title: 'Strong',
            value: 'strong',
          },
        ],
      },
      // Inline blocks
      of: [{type: 'blockInlineProduct'}, {type: 'blockInlineProductMarginalia'}],
      styles: [
        {title: 'Heading', value: 'h2'},
        {title: 'Quote', value: 'blockquote'},
      ],
      type: 'block',
    }),
    // Custom blocks
    defineArrayMember({
      name: 'blockImage',
      type: 'blockImage',
    }),
    defineArrayMember({
      name: 'blockProduct',
      type: 'blockProduct',
    }),
  ],
})
