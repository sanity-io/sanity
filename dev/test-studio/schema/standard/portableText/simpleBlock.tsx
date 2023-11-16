import React from 'react'
import {PortableTextInput, defineArrayMember, defineType} from 'sanity'
import {toPlainText} from '@portabletext/react'
import {Box} from '@sanity/ui'
import {props} from 'packages/sanity/src/core/preview/utils/props'
import {CalloutPreview} from './components/CalloutPreview'

const linkType = defineArrayMember({
  type: 'object',
  name: 'link',
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
      width: 2,
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
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'link',
                fields: [
                  {
                    name: 'url',
                    type: 'url',
                    validation: (Rule) =>
                      Rule.regex(/https:\/\/(www\.|)(portabletext\.org|sanity\.io)\/.*/gi, {
                        name: 'internal url',
                        invert: true,
                      }).warning(
                        `This is not an external link. Consider using internal links instead.`,
                      ),
                  },
                ],
              },
              {
                name: 'internalLink',
                type: 'object',
                title: 'Internal link',
                fields: [
                  {
                    name: 'reference',
                    type: 'reference',
                    to: [{type: 'book'}],
                  },
                  {
                    name: 'reference1',
                    type: 'reference',
                    to: [{type: 'author'}],
                  },
                  {
                    name: 'reference2',
                    type: 'reference',
                    to: [{type: 'author'}],
                  },
                  {
                    name: 'reference3',
                    type: 'reference',
                    to: [{type: 'author'}],
                  },
                ],
              },
            ],
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
        defineArrayMember({
          type: 'image',
          name: 'image',
          components: {
            block: (blockProps) => {
              return blockProps.renderDefault({
                ...blockProps,
                renderPreview: (previewProps) => {
                  return blockProps.children
                },
              })
            },
          },
        }),
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
        defineArrayMember({
          ...myStringType,
          components: {
            block: (blockProps) => {
              return blockProps.children
              // return blockProps.renderDefault(blockProps)
            },
            // block: (blockProps) => {
            //   return blockProps.renderDefault({
            //     ...blockProps,
            //     renderPreview: (previewProps) => {
            //       return blockProps.children
            //     },
            //   })
            // },
          },
        }),
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
        input: (inputProps) => <PortableTextInput {...inputProps} fullscreen />,
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
