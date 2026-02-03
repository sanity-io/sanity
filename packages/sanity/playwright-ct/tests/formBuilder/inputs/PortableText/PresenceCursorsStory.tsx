import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type FormNodePresence} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

const schemaTypes = [
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
      }),
    ],
  }),
]

interface PresenceCursorsStoryProps {
  presence: FormNodePresence[]
  document: SanityDocument
}

export function PresenceCursorsStory(props: PresenceCursorsStoryProps) {
  const {document, presence} = props

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} presence={presence} />
    </TestWrapper>
  )
}
