import {type RangeDecoration} from '@sanity/portable-text-editor'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {type InputProps, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

export function RangeDecorationStory({
  document,
  rangeDecorations,
}: {
  document?: SanityDocument
  rangeDecorations?: RangeDecoration[]
}) {
  const schemaTypes = useMemo(
    () => [
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
              }),
            ],
            components: {
              input: (inputProps: InputProps) => {
                const editorProps = {
                  ...inputProps,
                  rangeDecorations,
                } as PortableTextInputProps
                return inputProps.renderDefault(editorProps)
              },
            },
          }),
        ],
      }),
    ],
    [rangeDecorations],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} />
    </TestWrapper>
  )
}
