import {defineArrayMember, defineField, defineType} from '@sanity/types'
import React from 'react'
import {TestWrapper} from '../../utils/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
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
    ],
  }),
]

export function ToolbarStory() {
  return <TestWrapper schemaTypes={SCHEMA_TYPES} />
}

export default ToolbarStory
