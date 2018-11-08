import icon from 'react-icons/lib/md/code'

export default {
  name: 'codeTest',
  type: 'document',
  title: 'Code test',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'code',
      title: 'Default theme',
      description: 'Selectable language',
      type: 'code',
      options: {
        languageAlternatives: [
          {title: 'LaTeX', value: 'latex'},
          {title: 'JavaScript', value: 'javascript'},
          {title: 'CSS', value: 'css'},
          {title: 'text', value: 'text'}
        ]
      }
    },
    {
      name: 'cssOrJsCode',
      title: 'Github theme',
      type: 'code',
      options: {
        theme: 'github',
        languageAlternatives: [
          {title: 'JavaScript', value: 'javascript'},
          {title: 'CSS', value: 'css'}
        ]
      }
    },
    {
      name: 'jscode',
      title: 'Monokai theme',
      description: 'Only javascript',
      type: 'code',
      options: {
        theme: 'monokai',
        language: 'javascript'
      }
    }
  ]
}
