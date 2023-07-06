import {Schema} from '@sanity/schema'

export default Schema.compile({
  name: 'withCustomBlockType',
  types: [
    {
      type: 'document',
      name: 'author',
      fields: [{type: 'string', name: 'name', title: 'Name'}],
    },
    {
      name: 'customBlock',
      type: 'block',
      // Only allow these styles
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
      ],
      // Only allow numbered lists
      lists: [{title: 'Numbered', value: 'number'}],
      marks: {
        // Only allow these decorators
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Code', value: 'code'},
          {title: 'Strike through', value: 'strike-through'},
          {title: 'Highlight', value: 'highlight'},
          {title: 'Subscript', value: 'sub'},
          {title: 'Superscript', value: 'sup'},
          {title: 'Mark', value: 'mark'},
          {title: 'Inserted', value: 'ins'},
          {title: 'Small', value: 'small'},
        ],
        // Support annotating text with a reference to an author
        annotations: [
          {
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: {type: 'author'},
          },
        ],
      },
    },
    {
      type: 'object',
      name: 'blogPost',
      fields: [
        {
          title: 'Title',
          type: 'string',
          name: 'title',
        },
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [{type: 'customBlock'}],
        },
      ],
    },
  ],
})
