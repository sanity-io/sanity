/* eslint-disable react/jsx-no-bind */
import {type SanityDocument} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'

import {TestForm} from '../../../utils/TestForm'
import {TestWrapper} from '../../../utils/TestWrapper'

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
            options: {
              unstable_whitespaceOnPasteMode: 'remove',
            },
          }),
          defineArrayMember({
            type: 'image',
            name: 'image',
            title: 'Image block',
            preview: {
              select: {
                fileName: 'asset.originalFilename',
                image: 'asset',
              },
              prepare({fileName, image}) {
                return {
                  media: image,
                  title: fileName,
                }
              },
            },
          }),
          defineArrayMember({
            type: 'file',
            name: 'filePDF',
            title: 'PDF file block',
            options: {
              accept: 'application/pdf',
            },
            preview: {
              select: {
                tile: 'asset.originalFilename',
              },
            },
          }),
        ],
      }),
      defineField({
        type: 'array',
        name: 'bodyNormalized',
        of: [
          defineArrayMember({
            type: 'block',
            options: {
              unstable_whitespaceOnPasteMode: 'normalize',
            },
          }),
        ],
      }),
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'object',
        name: 'objectWithColumns',
        title: 'Object with columns',
        options: {
          columns: 4,
        },
        fields: [
          {
            type: 'string',
            title: 'String 1',
            description: 'this is a king kong description',
            name: 'string1',
          },
          {
            type: 'string',
            title: 'String 2',
            name: 'string2',
          },
          {
            type: 'number',
            title: 'Number 1',
            name: 'number1',
          },
          {
            type: 'number',
            title: 'Number 2',
            name: 'number2',
          },
          {
            type: 'image',
            title: 'Image 1',
            name: 'image1',
          },
          {
            name: 'file',
            type: 'file',
            title: 'File',
          },
        ],
      }),
      defineField({
        name: 'arrayOfPrimitives',
        type: 'array',
        of: [
          {
            type: 'string',
            title: 'A string',
          },
          {
            type: 'number',
            title: 'A number',
          },
          {
            type: 'boolean',
            title: 'A boolean',
          },
        ],
      }),
      defineField({
        name: 'arrayOfMultipleTypes',
        title: 'Array of multiple types',
        type: 'array',
        of: [
          {
            type: 'image',
          },
          {
            type: 'object',
            name: 'color',
            title: 'Color with a long title',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
              {
                name: 'name',
                type: 'string',
              },
            ],
          },
        ],
      }),
    ],
  }),
]

export function CopyPasteStory({
  focusPath,
  document,
}: {
  focusPath?: Path
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} />
    </TestWrapper>
  )
}

export default CopyPasteStory
