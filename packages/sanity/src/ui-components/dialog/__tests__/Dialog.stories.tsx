import {Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Dialog} from '../Dialog'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` Dialog.
 * Rendered inside `TestWrapper` because the footer's default button labels
 * resolve through the studio i18n instance the mock workspace registers.
 */
const meta = {
  title: 'UI Components/Dialog',
  component: Dialog,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'storybook-dialog',
    header: 'Unpublish document',
    width: 1,
    onClose: () => null,
    children: (
      <Text size={1}>
        Are you sure you want to unpublish this document? It will no longer be available to the
        public.
      </Text>
    ),
    footer: {
      description: 'This action can be reverted',
      cancelButton: {text: 'Cancel'},
      confirmButton: {text: 'Unpublish', tone: 'critical'},
    },
  },
}

const overflowingBody = (
  <VStack gap={3}>
    {Array.from({length: 40}, (_, index) => (
      <Text key={index} size={1}>
        Paragraph {index + 1}. Scroll to the end to check that body padding is still below this
        text.
      </Text>
    ))}
    <Text size={1}>End of dialog content.</Text>
  </VStack>
)

/**
 * Tall body scrolled to the end so Chromatic can see padding-bottom. ui5 Box
 * with flex-basis 0% + flex-grow 1 (and its default minHeight 0) sizes to the
 * scrollport, which drops that padding out of the scrollable overflow.
 */
export const OverflowingBody: Story = {
  args: {
    id: 'storybook-dialog-overflow',
    header: 'Overflowing dialog',
    width: 1,
    onClose: () => null,
    children: overflowingBody,
  },
  play: async () => {
    const body = within(document.body)
    const dialog = await body.findByRole('dialog', {}, {timeout: 5000})
    const content = dialog.querySelector('[data-ui="DialogContent"]')
    if (!(content instanceof HTMLElement)) {
      throw new Error('expected [data-ui="DialogContent"]')
    }
    await waitFor(() => expect(content.scrollHeight).toBeGreaterThan(content.clientHeight))
    content.scrollTop = content.scrollHeight
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
