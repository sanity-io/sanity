import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {Box, Text} from '@sanity/ui'
import React from 'react'
import {TestWrapper} from './utils/TestWrapper'
import {PreviewProps} from 'sanity'

// This is to emulate preview updates to the object without the preview store
function CustomObjectPreview(props: PreviewProps) {
  return (
    <Box padding={1}>
      <Text>Custom preview block:</Text> {props.renderDefault({...props})}
    </Box>
  )
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'string',
        name: 'requiredSubtitle',
        title: 'Required Subtitle',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              defineArrayMember({
                type: 'object',
                title: 'Inline Object',
                components: {
                  preview: CustomObjectPreview,
                },
                fields: [
                  defineField({
                    type: 'string',
                    name: 'title',
                    title: 'Title',
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            name: 'object',
            type: 'object',
            title: 'Object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
            components: {
              preview: CustomObjectPreview,
            },
          }),
          defineArrayMember({
            name: 'objectWithoutTitle',
            type: 'object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
          }),
        ],
      }),
      defineField({
        type: 'string',
        name: 'genre',
        title: 'Genre',
        options: {
          list: [
            {title: 'Sci-Fi', value: 'sci-fi'},
            {title: 'Western', value: 'western'},
          ],
        },
      }),
      defineField({
        type: 'array',
        name: 'bodyStyles',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [{title: 'Normal', value: 'normal'}],
          }),
          defineArrayMember({
            name: 'object',
            type: 'object',
            title: 'Object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
          }),
        ],
      }),
    ],
  }),
]

export function PortableTextInputStory() {
  return <TestWrapper schemaTypes={SCHEMA_TYPES} />
}

export default PortableTextInputStory
