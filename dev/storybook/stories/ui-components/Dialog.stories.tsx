import {Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {Dialog} from '../../../../packages/sanity/src/ui-components/dialog/Dialog'
import {TestWrapper} from '../../../../packages/sanity/test/browser/TestWrapper'

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
