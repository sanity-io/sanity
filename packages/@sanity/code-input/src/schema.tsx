import React from 'react'
import {CodeBlockIcon} from '@sanity/icons'
import {CodeInput} from './CodeInput'
import PreviewCode, {PreviewCodeProps} from './PreviewCode'
import {getMedia} from './getMedia'

export type {CodeInputProps, CodeSchemaType} from './CodeInput'

export type {CodeInputLanguage, CodeInputValue} from './types'

const Preview = (props: PreviewCodeProps) => {
  return <PreviewCode {...props} />
}

export default {
  name: 'code',
  type: 'object',
  title: 'Code',
  components: {input: CodeInput},
  icon: CodeBlockIcon,
  fields: [
    {
      name: 'language',
      title: 'Language',
      type: 'string',
    },
    {
      name: 'filename',
      title: 'Filename',
      type: 'string',
    },
    {
      title: 'Code',
      name: 'code',
      type: 'text',
    },
    {
      title: 'Highlighted lines',
      name: 'highlightedLines',
      type: 'array',
      of: [
        {
          type: 'number',
          title: 'Highlighted line',
        },
      ],
    },
  ],
  preview: {
    select: {
      language: 'language',
      code: 'code',
      filename: 'filename',
      highlightedLines: 'highlightedLines',
    },
    prepare: (value: {
      language?: string
      code?: string
      filename?: string
      highlightedLines?: number[]
    }) => {
      return {
        title: value.filename || (value.language || 'unknown').toUpperCase(),
        media: getMedia(value?.language),
        extendedPreview: <Preview value={value} />,
      }
    },
  },
}
