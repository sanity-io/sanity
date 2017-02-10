import {SlateInput} from '@sanity/form-builder'

export default [
  {
    name: 'lowLevelBlocksTest',
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
        type: 'array',
        inputComponent: SlateInput,
        of: [
          {
            type: 'block',
            title: 'Block'
          },
          {
            type: 'address',
            title: 'Address'
          },
          {
            type: 'image',
            title: 'Image'
          }
        ],
      }
    ]
  },
  {
    name: 'h1',
    title: 'header1',
    type: 'object',
    fields: [
      {
        name: 'marks',
        type: 'array',
      }
    ]
  },
  {
    name: 'block',
    type: 'object',
    preview: {
      fields: {
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
            {title: 'Normal', value: undefined},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'}
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
          },
          {
            type: 'link',
            title: 'Link'
          },
          {
            type: 'image',
            title: 'Image'
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
        type: 'array',
        name: 'marks',
        title: 'Marks',
        of: [{type: 'string'}],
        options: {
          direction: 'vertical',
          list: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'}
          ]
        }
      }
    ]
  },
  {
    name: 'link',
    type: 'object',
    fields: [
      {
        type: 'url',
        name: 'href',
        title: 'Url'
      },
      {
        name: 'spans',
        title: 'Spans',
        type: 'array',
        of: [
          {
            type: 'span',
            title: 'Text'
          }
        ]
      }
    ]
  },
  {
    name: 'mark',
    type: 'object',
    title: 'Mark',
    fields: [
      {
        name: 'type',
        title: 'Type',
        type: 'string'
      }
    ]
  },
  {
    name: 'address',
    type: 'object',
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
  }
]
