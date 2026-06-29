import {type SanityDocument} from '@sanity/client'
import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type BlockListItemProps, type BlockStyleProps} from '../../../types'

function CustomStyleComponent(props: BlockStyleProps) {
  return <div data-testid="custom-style-component">{props.renderDefault(props)}</div>
}

function CustomListItemComponent(props: BlockListItemProps) {
  return <div data-testid="custom-list-component">{props.renderDefault(props)}</div>
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'customComponents',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'Custom Style', value: 'custom', component: CustomStyleComponent},
            ],
            lists: [
              {title: 'Custom List', value: 'customList', component: CustomListItemComponent},
            ],
          }),
        ],
      }),
    ],
  }),
]

export function CustomBlockComponentsStory({document}: {document?: SanityDocument}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} />
    </TestWrapper>
  )
}
