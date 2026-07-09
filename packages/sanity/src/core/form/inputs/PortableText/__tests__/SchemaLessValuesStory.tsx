import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// A deliberately tight schema: no lists, one style, one decorator, no
// annotations. The seeded document below references types outside all four
// sets, simulating a schema that was tightened after content was written.
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
            lists: [],
            styles: [{title: 'Normal', value: 'normal'}],
            marks: {
              decorators: [{title: 'Strong', value: 'strong'}],
              annotations: [],
            },
          }),
        ],
      }),
    ],
  }),
]

const document = {
  _id: '123',
  _type: 'test',
  _createdAt: '2021-11-04T15:41:48Z',
  _updatedAt: '2021-11-05T12:34:29Z',
  _rev: '5hb8s6-k75-ip4-4bq-5ztbf3fbx',
  body: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [{_type: 'span', _key: 'a1', text: 'schema-less list item', marks: []}],
    },
    {
      _type: 'block',
      _key: 'b',
      style: 'h1',
      markDefs: [],
      children: [{_type: 'span', _key: 'b1', text: 'schema-less style', marks: []}],
    },
    {
      _type: 'block',
      _key: 'c',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 'c1', text: 'schema-less decorator', marks: ['em']}],
    },
    {
      _type: 'block',
      _key: 'd',
      style: 'normal',
      markDefs: [{_type: 'link', _key: 'd0', href: 'https://example.com'}],
      children: [{_type: 'span', _key: 'd1', text: 'schema-less annotation', marks: ['d0']}],
    },
    {
      _type: 'block',
      _key: 'e',
      style: 'h2',
      listItem: 'number',
      level: 1,
      markDefs: [],
      children: [{_type: 'span', _key: 'e1', text: 'schema-less style and list', marks: []}],
    },
    {
      _type: 'block',
      _key: 'f',
      style: 'normal',
      markDefs: [{_type: 'link', _key: 'f0', href: 'https://example.com'}],
      children: [
        {
          _type: 'span',
          _key: 'f1',
          text: 'schema-less mark and annotation',
          marks: ['em', 'f0'],
        },
      ],
    },
  ],
}

export function SchemaLessValuesStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} />
    </TestWrapper>
  )
}
