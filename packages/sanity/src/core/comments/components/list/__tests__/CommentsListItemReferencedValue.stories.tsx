import {type PortableTextBlock} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CommentsListItemReferencedValue} from '../CommentsListItemReferencedValue'

const QUOTE: PortableTextBlock[] = [
  {
    _key: 'quote',
    _type: 'block',
    children: [{_key: 'span', _type: 'span', marks: [], text: 'The referenced paragraph'}],
    markDefs: [],
    style: 'normal',
  },
]

/**
 * Chromatic sentinel for the ui5 Box quote (referenced vs missing). Quote
 * text is a static portable-text fixture (no timestamps).
 */
const meta = {
  title: 'Comments/Referenced Value',
  component: CommentsListItemReferencedValue,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof CommentsListItemReferencedValue>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {hasReferencedValue: true, value: QUOTE},
  render: () => (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            referenced
          </Text>
          <CommentsListItemReferencedValue hasReferencedValue value={QUOTE} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            missing referenced value
          </Text>
          <CommentsListItemReferencedValue hasReferencedValue={false} value={QUOTE} />
        </VStack>
      </VStack>
    </Card>
  ),
}
