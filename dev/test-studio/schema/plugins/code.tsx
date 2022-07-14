import {CodeBlockIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export default defineType({
  name: 'codeTest',
  type: 'document',
  title: 'Code test',
  icon: CodeBlockIcon,
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
        withFilename: true,
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
})
