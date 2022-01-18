import {CodeBlockIcon} from '@sanity/icons'

// eslint-disable-next-line import/no-unassigned-import
import 'ace-builds/src-noconflict/mode-rust'
import 'ace-builds/src-noconflict/mode-c_cpp'

export default {
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
      name: 'customMode',
      title: 'Custom mode',
      description: 'Custom, unsupported modes',
      type: 'code',
      options: {
        languageAlternatives: [
          {title: 'Rust', value: 'rust', mode: 'rust'},
          {title: 'JavaScript', value: 'javascript'},
          {title: 'C++', value: 'cpp', mode: 'c_cpp'},
        ],
      },
    },
    {
      name: 'codeArray',
      title: 'Code in arrays',
      description: 'Code in arrays',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'code',
          options: {
            withFilename: true,
            languageAlternatives: [
              {title: 'Rust', value: 'rust', mode: 'rust'},
              {title: 'JavaScript', value: 'javascript'},
            ],
          },
        },
      ],
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
