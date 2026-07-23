import {
  defineArrayMember,
  defineField,
  defineType,
  type PortableTextBlock,
  type SanityDocument,
} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// The same custom rule guards root blocks and cell blocks, so validation
// marker rendering can be compared across depths.
const noBadWords = (block: PortableTextBlock | undefined) => {
  const hasBad =
    Array.isArray(block?.children) &&
    block.children.some((child) => typeof child.text === 'string' && child.text.includes('bad'))
  return hasBad ? 'No bad words' : true
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
        of: [
          defineArrayMember({
            type: 'block',
            validation: (Rule) => Rule.custom(noBadWords),
          }),
          defineArrayMember({
            type: 'object',
            name: 'table',
            fields: [
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
                                of: [
                                  defineArrayMember({
                                    type: 'block',
                                    validation: (Rule) => Rule.custom(noBadWords),
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

export function TableValidationDepthStory(props: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={props.document} />
    </TestWrapper>
  )
}
