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
