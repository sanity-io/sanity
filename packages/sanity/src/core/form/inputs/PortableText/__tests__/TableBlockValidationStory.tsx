import {
  defineArrayMember,
  defineField,
  defineType,
  type PortableTextBlock,
  type SanityDocument,
} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// Keyed per table: the negative assertion needs the captioned table left unmarked.
const tablesMustHaveCaptions = (blocks: PortableTextBlock[] | undefined) => {
  const tables = (blocks?.filter((block) => block._type === 'table') ??
    []) as (PortableTextBlock & {
    caption?: string
  })[]
  const errors = tables
    .filter((table) => !table.caption)
    .map((table) => ({message: 'Table must have a caption', path: [{_key: table._key}]}))
  return errors.length > 0 ? errors : true
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        validation: (Rule) => Rule.custom(tablesMustHaveCaptions),
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
              defineField({type: 'string', name: 'caption'}),
              defineField({type: 'number', name: 'headerRows'}),
              defineField({
                type: 'array',
                name: 'rows',
                of: [
                  defineArrayMember({
                    type: 'object',
                    name: 'row',
                    fields: [
                      defineField({
                        type: 'array',
                        name: 'cells',
                        of: [
                          defineArrayMember({
                            type: 'object',
                            name: 'cell',
                            fields: [
                              defineField({
                                type: 'array',
                                name: 'value',
                                of: [defineArrayMember({type: 'block'})],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
        components: {
          portableText: {
            plugins: (props) =>
              props.renderDefault({
                ...props,
                plugins: {
                  ...props.plugins,
                  table: {enabled: true},
                },
              }),
          },
        },
      }),
    ],
  }),
]

export function TableBlockValidationStory(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}
