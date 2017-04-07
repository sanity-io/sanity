import {SlateInput} from '@sanity/form-builder'

export default [
  {
    name: 'blocksTest',
    title: 'Blocks test',
    type: 'object',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'content',
        title: 'Content',
        inputComponent: SlateInput,
        type: 'array',
        of: [
          {type: 'image', title: 'Image'},
          {
            type: 'block',
            styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'H1', value: 'h1'},
              {title: 'H2', value: 'h2'},
              {title: 'Quote', value: 'blockquote'}
            ],
            lists: [
              {title: 'None', value: ''},
              {title: 'Bullet', value: 'bullet'},
              {title: 'Numbered', value: 'number'}
            ],
            span: {
              marks: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'}
              ],
              fields: [
                {name: 'link', type: 'url', title: 'Link'}
              ]
            }
          }
        ]
      },
      {
        name: 'other',
        title: 'Other content (limited)',
        inputComponent: SlateInput,
        type: 'array',
        of: [
          {
            type: 'block',
            styles: [],
            lists: [],
            span: {
              marks: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'}
              ]
            }
          }
        ]
      },
      {
        name: 'defaults',
        title: 'Defaults',
        inputComponent: SlateInput,
        type: 'array',
        of: [{type: 'block'}]
      }
    ]
  }
]
