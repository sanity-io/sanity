
function resolveOption(input, defaultValue) {
  if (typeof input === 'undefined') {
    return defaultValue
  }
  if (typeof input === 'function') {
    return input(defaultValue)
  }
  return input
}

export default function createTypes(options = {}) {
  const {marks, styles, lists, spanTypes} = options
  return [
    {
      name: 'span',
      type: 'object',
      fields: [
        ...resolveOption(
          spanTypes,
          [
            {
              type: 'object',
              name: 'link',
              title: 'Link',
              fields: [
                {
                  type: 'url',
                  name: 'href',
                }
              ]
            }
          ]
        ),
        {
          type: 'text',
          name: 'text',
          title: 'Text'
        },
        {
          type: 'array',
          name: 'marks',
          title: 'Marks',
          of: [{type: 'string'}],
          options: {
            direction: 'vertical',
            list: resolveOption(
              marks, [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'},
                {title: 'Code', value: 'code'},
                {title: 'Underline', value: 'underline'},
                {title: 'Strike', value: 'strike-through'}
              ]
            )
          }
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
            list: resolveOption(
              styles, [
                {title: 'Normal', value: 'normal'},
                {title: 'H1', value: 'h1'},
                {title: 'H2', value: 'h2'},
                {title: 'H3', value: 'h3'},
                {title: 'H4', value: 'h4'},
                {title: 'H5', value: 'h5'},
                {title: 'H6', value: 'h6'},
                {title: 'Quote', value: 'blockquote'}
              ]
            )
          }
        },
        {
          name: 'list',
          title: 'List type',
          type: 'string',
          options: {
            list: [
              {title: 'None', value: ''},
              ...(resolveOption(
                lists,
                [
                  {title: 'Bullet', value: 'bullet'},
                  {title: 'Numbered', value: 'number'}
                ]
              )
            )]
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
    }
  ]
}
