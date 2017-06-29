import Preview from './Preview'

export default {
  name: 'code',
  type: 'object',
  fields: [
    {
      title: 'Code',
      name: 'code',
      type: 'text'
    },
    {
      name: 'language',
      title: 'Language',
      type: 'string'
    },
    {
      title: 'Highlighted lines',
      name: 'highlightedLines',
      type: 'array',
      of: [{
        type: 'number',
        title: 'Highlighted line'
      }]
    }
  ],
  preview: {
    component: Preview
  }
}
