import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayOfObjectOptionsInput} from '../ArrayOfObjectOptionsInput'

function ArrayOfObjectOptionsSchemaInput(props: ComponentProps<typeof ArrayOfObjectOptionsInput>) {
  return <ArrayOfObjectOptionsInput {...props} />
}

const SCHEMA = [
  defineType({
    type: 'object',
    name: 'tag',
    fields: [defineField({type: 'string', name: 'label', title: 'Label'})],
    preview: {select: {title: 'label'}},
  }),
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [defineArrayMember({type: 'tag'})],
        options: {
          list: [
            {_key: 'news', _type: 'tag', label: 'News'},
            {_key: 'opinion', _type: 'tag', label: 'Opinion'},
            {_key: 'reviews', _type: 'tag', label: 'Reviews'},
          ],
        },
        components: {input: ArrayOfObjectOptionsSchemaInput},
      }),
      defineField({
        type: 'array',
        name: 'sizes',
        title: 'Sizes',
        of: [defineArrayMember({type: 'tag'})],
        options: {
          layout: 'grid',
          list: [
            {_key: 'small', _type: 'tag', label: 'Small'},
            {_key: 'medium', _type: 'tag', label: 'Medium'},
            {_key: 'large', _type: 'tag', label: 'Large'},
            {_key: 'xlarge', _type: 'tag', label: 'Extra large'},
          ],
        },
        components: {input: ArrayOfObjectOptionsSchemaInput},
      }),
    ],
  }),
]

const DOCUMENT: SanityDocument = {
  _id: 'object-options-input',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'object-options-input-rev',
  tags: [{_key: 'news', _type: 'tag', label: 'News'}],
  sizes: [
    {_key: 'small', _type: 'tag', label: 'Small'},
    {_key: 'large', _type: 'tag', label: 'Large'},
  ],
}

/**
 * Chromatic sentinel for the array-of-object options input after the ui5
 * Grid/Flex/Box migration. List vs grid, checked vs unchecked, each option
 * showing the default object preview. The primitive-options browser test does
 * not one-hop this file. Fixture titles — no live documents.
 */
export function ArrayOfObjectOptionsInputStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <Card padding={4} style={{maxWidth: 480}}>
        <TestForm document={DOCUMENT} />
      </Card>
    </TestWrapper>
  )
}
