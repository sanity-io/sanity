import {Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DialogStory} from '../../../../packages/sanity/src/ui-components/dialog/__tests__/DialogStory'

/**
 * Reuses the in-package harness: studio Dialog wrapper inside TestWrapper so
 * footer labels resolve through studio i18n.
 */
const meta = {
  title: 'UI Components/Dialog',
  component: DialogStory,
} satisfies Meta<typeof DialogStory>

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
