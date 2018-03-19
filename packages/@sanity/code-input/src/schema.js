import Preview from './Preview'

export default {
  name: 'code',
  type: 'object',
  title: 'Code',
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
      of: [
        {
          type: 'number',
          title: 'Highlighted line'
        }
      ]
    }
  ],
  preview: {
    select: {
      code: 'code',
      language: 'language'
    },
    component: Preview
  }
}
