import React, {useRef} from 'react'
import {defineArrayMember, defineType} from 'sanity'
import {toPlainText} from '@portabletext/react'
import {ScratchPadInput, ScratchPadProvider} from 'sanity/scratchPad'
import {PortableTextEditor} from '@sanity/portable-text-editor'
import {position} from 'polished'
import styled from 'styled-components'
import {CalloutPreview} from './components/CalloutPreview'

const linkType = defineArrayMember({
  type: 'object',
  name: 'link',
  title: 'Lanky',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}).required(),
    },
  ],
  options: {
    modal: {
      type: 'popover',
      width: [1, 2],
    },
  },
})

const myStringType = defineArrayMember({
  type: 'object',
  name: 'test',
  fields: [
    {type: 'string', name: 'mystring', validation: (Rule) => Rule.required()},
    {type: 'string', name: 'otherstring', validation: (Rule) => Rule.required()},
  ],
})

export default defineType({
  name: 'simpleBlock',
  title: 'Simple block',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      components: {
        input: () => null,
        field: (props) => props.children,
      },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [linkType],
          },
          of: [
            {type: 'image', name: 'image'},
            myStringType,
            {
              type: 'reference',
              name: 'strongAuthorRef',
              title: 'A strong author ref',
              to: {type: 'author'},
            },
          ],
          validation: (Rule) =>
            Rule.custom<any>((block) => {
              const text = toPlainText(block ? [block] : [])
              return text.length === 1 ? 'Please write a longer paragraph.' : true
            }),
          options: {
            spellCheck: true,
          },
        }),
        {
          type: 'image',
          name: 'image',
        },
        {
          type: 'object',
          name: 'callout',
          title: 'Callout',
          components: {
            preview: CalloutPreview,
          },
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
            {
              type: 'string',
              name: 'tone',
              title: 'Tone',
              options: {
                list: [
                  {value: 'default', title: 'Default'},
                  {value: 'primary', title: 'Primary'},
                  {value: 'positive', title: 'Positive'},
                  {value: 'caution', title: 'Caution'},
                  {value: 'critical', title: 'Critical'},
                ],
              },
            },
          ],
          preview: {
            select: {
              title: 'title',
              tone: 'tone',
            },
          },
        },
        myStringType,
        {
          name: 'authors',
          type: 'object',
          fields: [
            {
              type: 'array',
              of: [{type: 'reference', to: [{type: 'author'}]}],
              name: 'references',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      components: {
        input: (inputProps: any) => {
          const editorRef = useRef<PortableTextEditor | null>(null)
          const assistantPromptRef = useRef<HTMLTextAreaElement | null>(null)
          return (
            <ScratchPadProvider editorRef={editorRef} assistantPromptRef={assistantPromptRef}>
              <ScratchPadInput {...inputProps} />
            </ScratchPadProvider>
          )
        },
      },
    },
    {
      name: 'notes',
      type: 'array',
      of: [
        {
          type: 'simpleBlockNote',
        },
      ],
    },
  ],
})
