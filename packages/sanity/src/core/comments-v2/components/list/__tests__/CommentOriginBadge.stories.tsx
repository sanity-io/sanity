import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CommentOriginBadge} from '../CommentOriginBadge'

/**
 * Draft vs published origin pills on comments-v2 list items. Chromatic
 * sentinel for `--card-icon-color` on the ring / dot (ui5 `Icon` greys them).
 */
const meta = {
  title: 'Comments (v2)/Origin Badge',
  component: CommentOriginBadge,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof CommentOriginBadge>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {origin: 'draft'},
  render: () => (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            from draft
          </Text>
          <CommentOriginBadge origin="draft" />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            from published
          </Text>
          <CommentOriginBadge origin="published" />
        </VStack>
      </VStack>
    </Card>
  ),
}
