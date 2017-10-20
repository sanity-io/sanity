
export default {
  name: 'codeTest',
  type: 'document',
  title: 'Code test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'code',
      title: 'Code',
      description: 'A plain code field',
      type: 'code',
      options: {
        theme: 'github',
        languageAlternatives: [
          {title: 'LaTeX', value: 'latex'},
          {title: 'JavaScript', value: 'javascript'},
          {title: 'CSS', value: 'css'},
          {title: 'text', value: 'text'}
        ]
      }
    }
  ]
}
