// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import CodeBlockIcon from 'part:@sanity/base/code-block-icon'
import CodeInput from './CodeInput'
import PreviewCode, {PreviewCodeProps} from './PreviewCode'
import {getMedia} from './getMedia'

const Preview = (props: PreviewCodeProps) => {
  return <PreviewCode {...props} />
}

export default {
  name: 'code',
  type: 'object',
  title: 'Code',
  inputComponent: CodeInput,
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
