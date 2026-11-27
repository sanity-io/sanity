import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {OtherReferenceCount} from '../ConfirmDeleteDialog.styles'

/**
 * The "N other references not shown" note from the delete confirmation's styles
 * module. The dialog itself, and the note inside it, are exercised by
 * `DocumentGroupInventoryPanels.browser.test.tsx`; this story renders the note
 * on its own so the styles module has coverage of its own.
 */
const meta = {
  title: 'Document Group Inventory/Confirm Delete Dialog',
  component: OtherReferenceCount,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Card border padding={2} radius={2} style={{display: 'inline-block'}}>
          <Story />
        </Card>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof OtherReferenceCount>

export default meta
type Story = StoryObj<typeof meta>

/** Five referrers in total, two listed: the note reports the three it left out. */
export const OtherReferences: Story = {
  args: {totalCount: 5, references: ['a', 'b']},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('3 other references not shown')).toBeVisible())
  },
}
