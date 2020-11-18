import {MdCode as icon} from 'react-icons/md'

export default {
  name: 'codeTest',
  type: 'document',
  title: 'Code test',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
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
          {title: 'text', value: 'text'},
          {title: 'Python', value: 'python'},
          {title: 'SASS', value: 'sass'},
          {title: 'SCSS', value: 'scss'},
          {title: 'GROQ', value: 'groq'},
          {title: 'My super custom language', value: 'custom'},
        ],
      },
    },
    {
      name: 'cssOrJsCode',
      title: 'Github theme',
      type: 'code',
      options: {
        theme: 'github',
        languageAlternatives: [
          {title: 'JavaScript', value: 'javascript'},
          {title: 'CSS', value: 'css'},
        ],
      },
    },
    {
      name: 'jscode',
      title: 'Monokai theme',
      description: 'Only javascript',
      type: 'code',
      options: {
        theme: 'monokai',
        language: 'javascript',
      },
    },
  ],
}
