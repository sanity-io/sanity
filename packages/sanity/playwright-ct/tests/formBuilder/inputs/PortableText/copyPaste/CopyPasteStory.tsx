/* eslint-disable react/jsx-no-bind */
import {Path, defineArrayMember, defineField, defineType} from '@sanity/types'
import {SanityDocument} from '@sanity/client'
import {TestWrapper} from '../../../utils/TestWrapper'
import {TestForm} from '../../../utils/TestForm'

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
