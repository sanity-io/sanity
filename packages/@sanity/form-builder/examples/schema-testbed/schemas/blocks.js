export default {
  types: [
    {
      name: 'blogpost',
      title: 'Blocks test',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string'
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'block',
              title: 'Block'
            },
            {
              type: 'address',
              title: 'Address'
            }
          ]
        }
      ]
    },
    {
      name: 'address',
      type: 'object',
      preview: {
        select: {
          title: 'street',
          subtitle: 'zip'
        }
      },
      fields: [
        {
          name: 'street',
          type: 'string',
          title: 'Street'
        },
        {
          name: 'zip',
          type: 'string',
          title: 'Zip'
        }
      ]
    },
    {
      name: 'block',
      type: 'object',
      preview: {
        select: {
          style: 'style',
          spans: 'spans'
        },
        prepare({style, spans}) {
          return {
            title: `${style ? `${style}: ` : ''} ${(spans || []).map(span => span.text).join(' ')}`
          }
        }
      },
      fields: [
        {
          name: 'style',
          title: 'Style',
          type: 'string',
          options: {
            list: [
              {title: 'Normal', value: 'normal'},
              {title: 'H1', value: 'h1'},
              {title: 'H2', value: 'h2'},
              {title: 'H3', value: 'h3'},
              {title: 'H4', value: 'h4'},
              {title: 'H5', value: 'h5'},
              {title: 'H6', value: 'h6'},
              {title: 'Quote', value: 'blockquote'}
            ]
          }
        },
        {
          name: 'list',
          title: 'List type',
          type: 'string',
          options: {
            list: [
              {title: 'None', value: ''},
              {title: 'Bullet', value: 'bullet'},
              {title: 'Numbered', value: 'number'}
            ]
          }
        },
        {
          name: 'indentation',
          title: 'Indentation',
          type: 'number'
        },
        {
          name: 'spans',
          type: 'array',
          title: 'Content',
          of: [
            {
              type: 'span',
              title: 'Span'
            }
          ]
        }
      ]
    },
    {
      name: 'span',
      type: 'object',
      fields: [
        {
          type: 'text',
          name: 'text',
          title: 'Text'
        },
        {
          type: 'object',
          name: 'link',
          title: 'Link',
          fields: [
            {
              type: 'url',
              name: 'href'
            }
          ]
        },
        {
          name: 'author',
          title: 'Author',
          type: 'reference',
          to: [{type: 'author'}]
        },
        {
          type: 'array',
          name: 'marks',
          title: 'Marks',
          of: [{type: 'string'}],
          options: {
            direction: 'vertical',
            list: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
              {title: 'Strike', value: 'strike-through'}
            ]
          }
        }
      ]
    }
  ]
}
