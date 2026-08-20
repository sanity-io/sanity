import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type BlockDecoratorProps} from '../../../types/blockProps'

function Highlight(props: BlockDecoratorProps) {
  return (
    <span
      data-testid="custom-highlight-decorator"
      data-title={props.title}
      data-value={props.value}
    >
      {props.renderDefault(props)}
    </span>
  )
}

function Spoiler(props: BlockDecoratorProps) {
  return (
    <span data-testid="custom-spoiler-decorator" style={{color: 'red'}}>
      {props.children}
    </span>
  )
}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'defaultDecorators',
        of: [
          defineArrayMember({
            type: 'block',
          }),
        ],
      }),
      defineField({
        type: 'array',
        name: 'customDecorator',
        of: [
          defineArrayMember({
            type: 'block',
            marks: {
              decorators: [
                {
                  title: 'Highlight',
                  value: 'highlight',
                  icon: BulbOutlineIcon,
                  component: Highlight,
                },
                {
                  title: 'Spoiler',
                  value: 'spoiler',
                  component: Spoiler,
                },
              ],
            },
          }),
        ],
      }),
    ],
  }),
]

export function DecoratorsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}
