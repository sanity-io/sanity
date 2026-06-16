import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

function schemaTypes(enableContainers?: boolean) {
  return [
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
                  name: 'inlineNote',
                  fields: [defineField({type: 'string', name: 'text'})],
                  preview: {select: {title: 'text'}},
                }),
              ],
            }),
            defineArrayMember({
              type: 'object',
              name: 'callout',
              fields: [defineField({type: 'string', name: 'title'})],
              preview: {select: {title: 'title'}},
            }),
          ],
          components: enableContainers ? {portableText: {enableContainers}} : undefined,
        }),
      ],
    }),
  ]
}

const DOCUMENT: SanityDocument = {
  _id: 'test',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'rev',
  body: [
    {
      _type: 'block',
      _key: 'block-0',
      style: 'normal',
      markDefs: [],
      children: [
        {_type: 'span', _key: 'span-0', text: 'Hello ', marks: []},
        {_type: 'inlineNote', _key: 'inline-0', text: 'Note'},
        {_type: 'span', _key: 'span-1', text: '', marks: []},
      ],
    },
    {_type: 'callout', _key: 'callout-0', title: 'Note'},
    {
      _type: 'block',
      _key: 'li-0',
      style: 'normal',
      listItem: 'number',
      level: 1,
      markDefs: [],
      children: [{_type: 'span', _key: 'li-0-span', text: 'First', marks: []}],
    },
    {
      _type: 'block',
      _key: 'li-1',
      style: 'normal',
      listItem: 'number',
      level: 1,
      markDefs: [],
      children: [{_type: 'span', _key: 'li-1-span', text: 'Second', marks: []}],
    },
  ],
}

export function RenderPipelineStory(props: {enableContainers?: boolean}) {
  return (
    <TestWrapper schemaTypes={schemaTypes(props.enableContainers)}>
      <TestForm document={DOCUMENT} />
    </TestWrapper>
  )
}
