/* eslint-disable react/no-multi-comp */
import React from 'react'

const Input = props => {
  const CodeInput = require('./CodeInput').default
  return <CodeInput {...props} />
}

const Preview = props => {
  const CodePreview = require('./Preview').default
  return <CodePreview {...props} />
}

export default {
  name: 'code',
  type: 'object',
  title: 'Code',
  inputComponent: Input,
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
